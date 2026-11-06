// Package ws is the realtime hub (spec §7.2): snapshot on hello, deltas from
// pub/sub, rider messages into the fusion engine.
package ws

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/coder/websocket"

	"github.com/metrokoi/backend/internal/fusion"
	"github.com/metrokoi/backend/internal/model"
)

const (
	sendBuffer   = 64
	pingEvery    = 20 * time.Second
	writeTimeout = 5 * time.Second
	readLimit    = 64 << 10
)

// Hooks let the app count things without the hub knowing about metrics/storage.
type Hooks struct {
	SessionStarted func(now time.Time)
	StationReport  func(model.ReportStationMsg)
	ClientsChanged func(n int)
}

type Hub struct {
	engine  *fusion.Engine
	origins []string
	hooks   Hooks
	now     func() time.Time
	log     *slog.Logger

	mu      sync.RWMutex
	clients map[*client]struct{}
}

type client struct {
	conn     *websocket.Conn
	send     chan []byte
	deviceID string
	sessions map[string]bool // sessions opened on this connection
}

func NewHub(engine *fusion.Engine, origins []string, hooks Hooks, log *slog.Logger) *Hub {
	return &Hub{engine: engine, origins: origins, hooks: hooks, now: time.Now, log: log, clients: map[*client]struct{}{}}
}

// SetClock replaces the hub's clock (tests and the simulator's fast mode).
func (h *Hub) SetClock(now func() time.Time) { h.now = now }

// Viewers is the number of connected clients ("helping N riders").
func (h *Hub) Viewers() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// Run fans out pub/sub messages to every client until ctx ends.
func (h *Hub) Run(ctx context.Context, in <-chan []byte) {
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-in:
			if !ok {
				return
			}
			h.mu.RLock()
			for c := range h.clients {
				c.enqueue(msg)
			}
			h.mu.RUnlock()
		}
	}
}

// enqueue drops the oldest message when the client is slow (spec §13).
func (c *client) enqueue(msg []byte) {
	for {
		select {
		case c.send <- msg:
			return
		default:
			select {
			case <-c.send:
			default:
			}
		}
	}
}

func (h *Hub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	opts := &websocket.AcceptOptions{OriginPatterns: h.origins}
	if len(h.origins) == 1 && h.origins[0] == "*" {
		opts = &websocket.AcceptOptions{InsecureSkipVerify: true} // dev: any origin
	}
	conn, err := websocket.Accept(w, r, opts)
	if err != nil {
		return
	}
	conn.SetReadLimit(readLimit)
	c := &client{conn: conn, send: make(chan []byte, sendBuffer), sessions: map[string]bool{}}
	h.mu.Lock()
	h.clients[c] = struct{}{}
	n := len(h.clients)
	h.mu.Unlock()
	if h.hooks.ClientsChanged != nil {
		h.hooks.ClientsChanged(n)
	}
	ctx, cancel := context.WithCancel(r.Context())
	defer func() {
		cancel()
		h.mu.Lock()
		delete(h.clients, c)
		n := len(h.clients)
		h.mu.Unlock()
		for id := range c.sessions {
			h.engine.StopSession(id)
		}
		if h.hooks.ClientsChanged != nil {
			h.hooks.ClientsChanged(n)
		}
		conn.CloseNow()
	}()
	go h.writer(ctx, c)
	// Every client gets a snapshot immediately, and again after hello
	// (on reconnect the server always sends a full snapshot, spec §7.2).
	h.sendSnapshot(c)
	for {
		_, data, err := conn.Read(ctx)
		if err != nil {
			return
		}
		h.handle(c, data)
	}
}

func (h *Hub) writer(ctx context.Context, c *client) {
	ping := time.NewTicker(pingEvery)
	defer ping.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-c.send:
			wctx, cancel := context.WithTimeout(ctx, writeTimeout)
			err := c.conn.Write(wctx, websocket.MessageText, msg)
			cancel()
			if err != nil {
				c.conn.CloseNow()
				return
			}
		case <-ping.C:
			pctx, cancel := context.WithTimeout(ctx, writeTimeout)
			err := c.conn.Ping(pctx)
			cancel()
			if err != nil {
				c.conn.CloseNow()
				return
			}
		}
	}
}

func (h *Hub) sendSnapshot(c *client) {
	now := h.now()
	c.enqueue(model.MustJSON(model.TrainsSnapshotMsg{T: "trains.snapshot", TS: now.UnixMilli(), Trains: h.engine.Snapshot(now)}))
}

func (h *Hub) ack(c *client, sessionID string) {
	c.enqueue(model.MustJSON(model.RiderAckMsg{T: "rider.ack", SessionID: sessionID, Helping: max(0, h.Viewers()-1)}))
}

func (h *Hub) handle(c *client, data []byte) {
	var env model.Envelope
	if json.Unmarshal(data, &env) != nil {
		return
	}
	now := h.now()
	switch env.T {
	case "hello":
		var m model.HelloMsg
		if json.Unmarshal(data, &m) == nil && m.DeviceID != "" {
			c.deviceID = m.DeviceID
			h.sendSnapshot(c)
		}
	case "rider.start":
		var m model.RiderStartMsg
		if json.Unmarshal(data, &m) != nil || m.SessionID == "" || c.deviceID == "" {
			return
		}
		if err := h.engine.StartSession(m.SessionID, c.deviceID, m.Score, now); err != nil {
			h.log.Debug("rider.start refused", "err", err) // drop silently (spec §7.2)
			return
		}
		c.sessions[m.SessionID] = true
		if h.hooks.SessionStarted != nil {
			h.hooks.SessionStarted(now)
		}
		h.ack(c, m.SessionID)
	case "rider.fix":
		var m model.RiderFixMsg
		if json.Unmarshal(data, &m) != nil || !c.sessions[m.SessionID] {
			return // only the connection that opened a session may feed it
		}
		h.engine.Ingest(m.Fix, now)
	case "rider.stop":
		var m model.RiderStopMsg
		if json.Unmarshal(data, &m) == nil && c.sessions[m.SessionID] {
			h.engine.StopSession(m.SessionID)
			delete(c.sessions, m.SessionID)
			h.ack(c, m.SessionID)
		}
	case "report.station":
		var m model.ReportStationMsg
		if json.Unmarshal(data, &m) == nil && h.hooks.StationReport != nil {
			h.hooks.StationReport(m)
		}
	}
}
