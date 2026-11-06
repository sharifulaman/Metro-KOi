// Package app wires store, engines, hub, API and background jobs together.
package app

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/metrokoi/backend/internal/config"
	"github.com/metrokoi/backend/internal/fusion"
	"github.com/metrokoi/backend/internal/geo"
	"github.com/metrokoi/backend/internal/httpapi"
	"github.com/metrokoi/backend/internal/model"
	"github.com/metrokoi/backend/internal/pubsub"
	"github.com/metrokoi/backend/internal/schedule"
	"github.com/metrokoi/backend/internal/store"
	"github.com/metrokoi/backend/internal/ws"
)

type App struct {
	Cfg     config.Config
	Log     *slog.Logger
	Store   store.Store
	PS      pubsub.PubSub
	Engine  *fusion.Engine
	Hub     *ws.Hub
	Handler http.Handler
	Data    httpapi.Data

	fixes chan model.RawFix
	salt  string
	m     metrics
}

type metrics struct {
	reg      *prometheus.Registry
	accepted prometheus.Counter
	rejected *prometheus.CounterVec
	riders   prometheus.Gauge
	tracks   *prometheus.GaugeVec
	clients  prometheus.Gauge
	reports  prometheus.Counter
}

func newMetrics() metrics {
	m := metrics{
		reg:      prometheus.NewRegistry(),
		accepted: prometheus.NewCounter(prometheus.CounterOpts{Name: "metrokoi_fixes_accepted_total", Help: "Rider fixes accepted."}),
		rejected: prometheus.NewCounterVec(prometheus.CounterOpts{Name: "metrokoi_fixes_rejected_total", Help: "Rider fixes rejected, by reason."}, []string{"reason"}),
		riders:   prometheus.NewGauge(prometheus.GaugeOpts{Name: "metrokoi_active_riders", Help: "Active sharing sessions."}),
		tracks:   prometheus.NewGaugeVec(prometheus.GaugeOpts{Name: "metrokoi_tracks", Help: "Published train tracks by state."}, []string{"state"}),
		clients:  prometheus.NewGauge(prometheus.GaugeOpts{Name: "metrokoi_ws_clients", Help: "Connected WebSocket clients."}),
		reports:  prometheus.NewCounter(prometheus.CounterOpts{Name: "metrokoi_station_reports_total", Help: "'Train at station now' reports."}),
	}
	m.reg.MustRegister(m.accepted, m.rejected, m.riders, m.tracks, m.clients, m.reports, prometheus.NewGoCollector())
	return m
}

// New builds the app. With empty DATABASE_URL / REDIS_URL it runs fully in memory.
func New(ctx context.Context, cfg config.Config, log *slog.Logger) (*App, error) {
	a := &App{Cfg: cfg, Log: log, m: newMetrics(), fixes: make(chan model.RawFix, 4096), salt: cfg.SessionSalt}
	if a.salt == "" {
		b := make([]byte, 16)
		_, _ = rand.Read(b)
		a.salt = hex.EncodeToString(b)
	}
	var err error
	if cfg.DatabaseURL != "" {
		if a.Store, err = store.NewPostgres(ctx, cfg.DatabaseURL); err != nil {
			return nil, fmt.Errorf("postgres: %w", err)
		}
		log.Info("store: postgres")
	} else {
		if a.Store, err = store.NewMemory(cfg.EndToEndMin, cfg.DwellSec, model.DayType(cfg.HolidayAs)); err != nil {
			return nil, err
		}
		log.Info("store: in-memory (embedded data)")
	}
	if cfg.RedisURL != "" {
		if a.PS, err = pubsub.NewRedis(cfg.RedisURL); err != nil {
			return nil, fmt.Errorf("redis: %w", err)
		}
		log.Info("pubsub: redis")
	} else {
		a.PS = pubsub.NewMemory()
		log.Info("pubsub: in-process")
	}
	if err := a.loadData(ctx); err != nil {
		return nil, err
	}
	line := geo.NewLine(a.Data.Line.Geometry.Coordinates)
	a.Engine = fusion.New(fusion.DefaultConfig(), line, a.Data.Run)
	a.Engine.OnAccept = a.onAccept
	a.Engine.OnReject = func(r model.RejectReason) { a.m.rejected.WithLabelValues(string(r)).Inc() }
	a.Hub = ws.NewHub(a.Engine, cfg.Origins(), ws.Hooks{
		SessionStarted: func(now time.Time) { _ = a.Store.IncSessionAgg(context.Background(), now) },
		StationReport:  func(model.ReportStationMsg) { a.m.reports.Inc() },
		ClientsChanged: func(n int) { a.m.clients.Set(float64(n)) },
	}, log)
	api := httpapi.New(a.Data, a.Engine, cfg.Origins(), func() error { return a.Store.Ping(context.Background()) })
	a.Handler = api.Routes(a.Hub, promhttp.HandlerFor(a.m.reg, promhttp.HandlerOpts{}))
	return a, nil
}

func (a *App) loadData(ctx context.Context) error {
	st, err := a.Store.Stations(ctx)
	if err != nil {
		return fmt.Errorf("stations: %w", err)
	}
	tt, err := a.Store.Timetable(ctx)
	if err != nil {
		return fmt.Errorf("timetable: %w", err)
	}
	line, err := a.Store.Line(ctx)
	if err != nil {
		return fmt.Errorf("line: %w", err)
	}
	fares, err := a.Store.Fares(ctx)
	if err != nil {
		return fmt.Errorf("fares: %w", err)
	}
	gates := map[string][]model.StationGate{}
	for _, s := range st {
		if gates[s.ID], err = a.Store.Gates(ctx, s.ID); err != nil {
			return fmt.Errorf("gates: %w", err)
		}
	}
	// learned segment times override the defaults once ≥ 30 samples exist (spec §4.4)
	learned := schedule.SegmentOverride{}
	if stats, err := a.Store.SegmentStats(ctx); err == nil {
		idx := map[string]int{}
		for i, s := range schedule.OpenStations(st) {
			idx[s.ID] = i
		}
		for _, s := range stats {
			if i, ok := idx[s.ToStation]; ok && s.Samples >= 30 && idx[s.FromStation] == i-1 {
				learned[i] = s.MedianSec // hour-of-day selection can refine this later
			}
		}
	}
	run := schedule.BuildRunModel(st, tt.EndToEndMin, tt.DwellSec, learned)
	if run.ApproxGeometry {
		return fmt.Errorf("stations have no chainage: run `go run ./cmd/fetch-osm` first")
	}
	a.Data = httpapi.Data{Stations: st, Gates: gates, Line: line, Timetable: tt, Fares: fares, Run: run, Holidays: a.Cfg.HolidaySet()}
	return nil
}

// onAccept queues a privacy-safe raw fix: daily-rotating salted hash, chainage only.
func (a *App) onAccept(f model.SnappedFix) {
	a.m.accepted.Inc()
	day := f.Received.UTC().Format("2006-01-02")
	h := sha256.Sum256([]byte(a.salt + day + f.SessionID))
	select {
	case a.fixes <- model.RawFix{SessionHash: hex.EncodeToString(h[:12]), TS: f.Received, ChainageM: f.ChainageM, Speed: f.Spd, Acc: f.Acc}:
	default: // never block the engine on storage
	}
}

// Run starts the 1 Hz fusion tick, fan-out, persistence and purge jobs.
func (a *App) Run(ctx context.Context) {
	go a.Hub.Run(ctx, a.PS.Subscribe(ctx))
	go a.persist(ctx)
	tick := time.NewTicker(time.Second)
	purge := time.NewTicker(time.Hour)
	defer tick.Stop()
	defer purge.Stop()
	n := 0
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-tick.C:
			a.TickOnce(ctx, now)
			if n++; n%5 == 0 {
				snap := model.MustJSON(model.TrainsSnapshotMsg{T: "trains.snapshot", TS: now.UnixMilli(), Trains: a.Engine.Snapshot(now)})
				_ = a.PS.SaveSnapshot(ctx, snap)
			}
		case now := <-purge.C:
			if k, err := a.Store.PurgeRawFixes(ctx, now.Add(-24*time.Hour)); err == nil && k > 0 {
				a.Log.Info("purged raw fixes", "rows", k)
			}
		}
	}
}

// TickOnce runs one fusion tick and publishes deltas (≤ 1 update/train/s).
func (a *App) TickOnce(ctx context.Context, now time.Time) {
	d := a.Engine.Tick(now)
	for _, t := range d.Updated {
		_ = a.PS.Publish(ctx, model.MustJSON(model.TrainUpdateMsg{T: "train.update", Train: t}))
	}
	for _, id := range d.Removed {
		_ = a.PS.Publish(ctx, model.MustJSON(model.TrainRemoveMsg{T: "train.remove", ID: id}))
	}
	sessions, byState := a.Engine.Counts()
	a.m.riders.Set(float64(sessions))
	for _, s := range []model.TrainState{model.StateLive, model.StateStale} {
		a.m.tracks.WithLabelValues(string(s)).Set(float64(byState[s]))
	}
}

func (a *App) persist(ctx context.Context) {
	t := time.NewTicker(5 * time.Second)
	defer t.Stop()
	var batch []model.RawFix
	for {
		select {
		case <-ctx.Done():
			return
		case f := <-a.fixes:
			batch = append(batch, f)
		case <-t.C:
			if len(batch) > 0 {
				if err := a.Store.InsertRawFixes(ctx, batch); err != nil {
					a.Log.Warn("raw fix insert failed", "err", err)
				}
				batch = batch[:0]
			}
		}
	}
}

func (a *App) Close() {
	a.Store.Close()
	_ = a.PS.Close()
}

// Line exposes the snapped line (simulator and tests generate fixes on it).
func (a *App) Line() *geo.Line { return geo.NewLine(a.Data.Line.Geometry.Coordinates) }
