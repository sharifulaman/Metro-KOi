package app

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math/rand/v2"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/coder/websocket"

	"github.com/metrokoi/backend/internal/config"
	"github.com/metrokoi/backend/internal/model"
	"github.com/metrokoi/backend/internal/sim"
)

func newTestApp(t *testing.T) (*App, *httptest.Server) {
	t.Helper()
	cfg := config.Config{EndToEndMin: 40, DwellSec: 30, HolidayAs: "fri", AllowedOrigins: "*"}
	a, err := New(context.Background(), cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	if err != nil {
		t.Fatal(err)
	}
	srv := httptest.NewServer(a.Handler)
	t.Cleanup(func() { srv.Close(); a.Close() })
	return a, srv
}

func getJSON(t *testing.T, url string, v any) *http.Response {
	t.Helper()
	res, err := http.Get(url)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if v != nil && res.StatusCode == 200 {
		if err := json.NewDecoder(res.Body).Decode(v); err != nil {
			t.Fatal(err)
		}
	}
	return res
}

func TestREST(t *testing.T) {
	_, srv := newTestApp(t)
	if res := getJSON(t, srv.URL+"/v1/health", nil); res.StatusCode != 200 {
		t.Fatalf("health %d", res.StatusCode)
	}
	var st []model.Station
	getJSON(t, srv.URL+"/v1/stations", &st)
	if len(st) != 16 || st[0].ID != "uttara-north" || st[0].ChainageM == nil {
		t.Fatalf("stations %d", len(st))
	}
	var gates []map[string]any
	getJSON(t, srv.URL+"/v1/stations/farmgate/gates", &gates)
	if len(gates) != 4 || gates[0]["hasLift"] != nil {
		t.Fatalf("gates %+v", gates)
	}
	if res := getJSON(t, srv.URL+"/v1/stations/nowhere/gates", nil); res.StatusCode != 404 {
		t.Fatalf("unknown station %d", res.StatusCode)
	}
	res := getJSON(t, srv.URL+"/v1/timetable", nil)
	etag := res.Header.Get("ETag")
	req, _ := http.NewRequest("GET", srv.URL+"/v1/timetable", nil)
	req.Header.Set("If-None-Match", etag)
	if r2, _ := http.DefaultClient.Do(req); etag == "" || r2.StatusCode != http.StatusNotModified {
		t.Fatalf("etag %q", etag)
	}
	var j model.JourneyResponse
	getJSON(t, srv.URL+"/v1/journey?from=mirpur-10&to=farmgate&at=2026-11-08T08:20:00%2B06:00", &j)
	if len(j.Options) != 3 || j.Options[0].Direction != model.SB || j.Options[0].FareBDT != nil {
		t.Fatalf("journey %+v", j)
	}
	var d model.DeparturesResponse
	getJSON(t, srv.URL+"/v1/stations/farmgate/departures?limit=2", &d)
	if d.ByDir[model.SB] == nil || d.ByDir[model.NB] == nil {
		t.Fatalf("departures %+v", d)
	}
}

// Task 10 acceptance: a simulated ride over the WebSocket appears as LIVE.
func TestWebSocketSimulatedRide(t *testing.T) {
	a, srv := newTestApp(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	start := time.Date(2026, 11, 8, 2, 0, 0, 0, time.UTC)
	var clock atomic.Int64
	clock.Store(start.UnixMilli())
	now := func() time.Time { return time.UnixMilli(clock.Load()) }
	a.Hub.SetClock(now)
	go a.Hub.Run(ctx, a.PS.Subscribe(ctx))

	wsURL := "ws" + strings.TrimPrefix(srv.URL, "http") + "/v1/ws"
	dial := func() *websocket.Conn {
		c, _, err := websocket.Dial(ctx, wsURL, nil)
		if err != nil {
			t.Fatal(err)
		}
		return c
	}
	send := func(c *websocket.Conn, v any) {
		if err := c.Write(ctx, websocket.MessageText, model.MustJSON(v)); err != nil {
			t.Fatal(err)
		}
	}

	// viewer
	viewer := dial()
	defer viewer.CloseNow()
	send(viewer, model.HelloMsg{T: "hello", DeviceID: "viewer", V: 1, Lang: "bn"})
	var gotLive atomic.Bool
	var firstT atomic.Value
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			_, b, err := viewer.Read(ctx)
			if err != nil {
				return
			}
			var m struct {
				T     string      `json:"t"`
				Train model.Train `json:"train"`
			}
			_ = json.Unmarshal(b, &m)
			if m.T == "train.update" && m.Train.State == model.StateLive && m.Train.Riders > 0 && m.Train.Lat != nil {
				if gotLive.CompareAndSwap(false, true) {
					firstT.Store(now())
				}
			}
		}
	}()

	// three riders on one train
	rng := rand.New(rand.NewPCG(3, 5))
	train := sim.NewTrain(a.Data.Run, model.SB, 19.4, 0.9, 30, rng)
	var riders []*sim.Rider
	var conns []*websocket.Conn
	for i := range 3 {
		r := sim.NewRider(fmt.Sprintf("s-%d", i), train, start, 0, 8, rng)
		c := dial()
		defer c.CloseNow()
		send(c, model.HelloMsg{T: "hello", DeviceID: r.DeviceID, V: 1, Lang: "en"})
		send(c, model.RiderStartMsg{T: "rider.start", SessionID: r.SessionID, Score: 4})
		riders, conns = append(riders, r), append(conns, c)
	}
	time.Sleep(50 * time.Millisecond)
	for sec := 0; sec < 120 && !gotLive.Load(); sec++ {
		clock.Store(start.Add(time.Duration(sec) * time.Second).UnixMilli())
		if sec%3 == 0 {
			for i, r := range riders {
				if f, _, ok := r.FixAt(a.Line(), now()); ok {
					send(conns[i], model.RiderFixMsg{T: "rider.fix", Fix: f})
				}
			}
		}
		time.Sleep(15 * time.Millisecond) // let the hub ingest
		a.TickOnce(ctx, now())
		time.Sleep(5 * time.Millisecond)
	}
	time.Sleep(100 * time.Millisecond)
	if !gotLive.Load() {
		t.Fatal("viewer never received a LIVE train.update")
	}
	t.Logf("LIVE train received %v into the ride", firstT.Load().(time.Time).Sub(start))

	// departures now include the live train approaching Farmgate (the REST
	// clock is real time, so it sorts among real scheduled trains)
	var d model.DeparturesResponse
	getJSON(t, srv.URL+"/v1/stations/farmgate/departures?limit=20", &d)
	found := false
	for _, x := range d.ByDir[model.SB] {
		found = found || (x.Source == model.SourceLive && x.EtaSec > 0)
	}
	if !found {
		t.Fatalf("expected a live departure, got %+v", d.ByDir[model.SB])
	}
	cancel()
	wg.Wait()
}
