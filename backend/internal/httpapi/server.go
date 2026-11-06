// Package httpapi is the REST API (spec §7.1). JSON, no auth in MVP.
package httpapi

import (
	"encoding/json"
	"net/http"
	"slices"
	"sort"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/metrokoi/backend/internal/fusion"
	"github.com/metrokoi/backend/internal/model"
	"github.com/metrokoi/backend/internal/schedule"
)

// Data is the static data the API serves (loaded once from the store).
type Data struct {
	Stations  []model.Station
	Gates     map[string][]model.StationGate
	Line      *model.LineFeature
	Timetable *model.Timetable
	Fares     *model.FaresFile
	Run       *schedule.RunModel
	Holidays  map[string]bool
}

type Server struct {
	data    Data
	engine  *fusion.Engine
	origins []string
	now     func() time.Time
	ready   func() error
}

func New(d Data, engine *fusion.Engine, origins []string, ready func() error) *Server {
	return &Server{data: d, engine: engine, origins: origins, now: time.Now, ready: ready}
}

// Routes mounts the REST endpoints plus the given WebSocket and metrics handlers.
func (s *Server) Routes(ws http.Handler, metrics http.Handler) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RealIP, middleware.Recoverer, middleware.Compress(5, "application/json", "application/geo+json"), s.cors)
	r.Get("/metrics", metrics.ServeHTTP)
	r.Get("/ws", ws.ServeHTTP)
	r.Route("/v1", func(r chi.Router) {
		r.Get("/ws", ws.ServeHTTP)
		r.Get("/health", s.health)
		r.Get("/stations", s.stations)
		r.Get("/stations/{id}/gates", s.gates)
		r.Get("/stations/{id}/departures", s.departures)
		r.Get("/line", s.line)
		r.Get("/timetable", s.timetable)
		r.Get("/fares", s.fares)
		r.Get("/journey", s.journey)
		r.Get("/trains", s.trains)
	})
	return r
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if o := r.Header.Get("Origin"); o != "" && (slices.Contains(s.origins, "*") || slices.Contains(s.origins, o)) {
			w.Header().Set("Access-Control-Allow-Origin", o)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "If-None-Match, Content-Type")
			w.Header().Set("Access-Control-Expose-Headers", "ETag")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func errJSON(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	if s.ready != nil {
		if err := s.ready(); err != nil {
			errJSON(w, http.StatusServiceUnavailable, err.Error())
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "time": s.now().UTC()})
}

// GET /v1/stations — open stations only (planned ones stay hidden).
func (s *Server) stations(w http.ResponseWriter, r *http.Request) {
	out := []model.Station{}
	for _, st := range s.data.Stations {
		if st.Status == model.StationOpen || r.URL.Query().Get("all") == "1" {
			out = append(out, st)
		}
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) knownStation(id string) bool { return s.data.Run.Index(id) >= 0 }

// GET /v1/stations/{id}/gates
func (s *Server) gates(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !s.knownStation(id) {
		errJSON(w, http.StatusNotFound, "unknown station")
		return
	}
	type gateOut struct {
		Gate         model.Gate   `json:"gate"`
		Lat          *float64     `json:"lat"`
		Lng          *float64     `json:"lng"`
		Corner       model.Corner `json:"corner"`
		LandmarkBn   *string      `json:"landmarkBn"`
		LandmarkEn   *string      `json:"landmarkEn"`
		HasLift      *bool        `json:"hasLift"`
		HasEscalator *bool        `json:"hasEscalator"`
	}
	out := []gateOut{}
	for _, g := range s.data.Gates[id] {
		out = append(out, gateOut{g.Gate, g.Lat, g.Lng, g.Corner, g.LandmarkBn, g.LandmarkEn, g.HasLift, g.HasEscalator})
	}
	writeJSON(w, http.StatusOK, out)
}

// GET /v1/line — GeoJSON + chainage per station.
func (s *Server) line(w http.ResponseWriter, r *http.Request) {
	chain := map[string]float64{}
	for i, id := range s.data.Run.StationIDs {
		chain[id] = s.data.Run.Chainage[i]
	}
	w.Header().Set("Cache-Control", "public, max-age=86400")
	writeJSON(w, http.StatusOK, map[string]any{"feature": s.data.Line, "chainage": chain})
}

// GET /v1/timetable — with ETag so the app can cache it.
func (s *Server) timetable(w http.ResponseWriter, r *http.Request) {
	etag := `"` + s.data.Timetable.Version + `"`
	w.Header().Set("ETag", etag)
	w.Header().Set("Cache-Control", "public, max-age=3600")
	if r.Header.Get("If-None-Match") == etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}
	writeJSON(w, http.StatusOK, s.data.Timetable)
}

// GET /v1/fares — matrix + discount; amounts null until the official chart is loaded.
func (s *Server) fares(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.data.Fares)
}

// GET /v1/stations/{id}/departures?limit=6 — LIVE ETAs first, then the timetable.
func (s *Server) departures(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !s.knownStation(id) {
		errJSON(w, http.StatusNotFound, "unknown station")
		return
	}
	limit := 6
	if v, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && v > 0 && v <= 20 {
		limit = v
	}
	now := s.now()
	sched := schedule.StationDepartures(s.data.Timetable, s.data.Run, id, now, limit+2, s.data.Holidays)
	live := s.engine.Snapshot(now)
	res := model.DeparturesResponse{StationID: id, DayType: schedule.DayTypeFor(now, s.data.Holidays), ByDir: map[model.Direction][]model.Departure{}}
	for _, dir := range []model.Direction{model.SB, model.NB} {
		var deps []model.Departure
		for _, t := range live {
			if t.Dir != dir {
				continue
			}
			if eta, ok := s.data.Run.ETAToStation(dir, t.S, id); ok {
				deps = append(deps, model.Departure{TrainID: t.ID, Direction: dir, Platform: model.PlatformFor(dir), EtaSec: eta, Source: model.SourceLive})
			}
		}
		for _, d := range sched[dir] {
			covered := false
			for _, l := range deps {
				if l.Source == model.SourceLive && abs(l.EtaSec-d.EtaSec) < 120 {
					covered = true
				}
			}
			if !covered {
				deps = append(deps, d)
			}
		}
		sort.SliceStable(deps, func(i, j int) bool { return deps[i].EtaSec < deps[j].EtaSec })
		if len(deps) > limit {
			deps = deps[:limit]
		}
		if deps == nil {
			deps = []model.Departure{}
		}
		res.ByDir[dir] = deps
	}
	writeJSON(w, http.StatusOK, res)
}

// GET /v1/journey?from=&to=&at= (at: RFC 3339 or ms epoch; default now)
func (s *Server) journey(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	from, to := q.Get("from"), q.Get("to")
	if !s.knownStation(from) || !s.knownStation(to) {
		errJSON(w, http.StatusBadRequest, "from and to must be station ids")
		return
	}
	at := s.now()
	if v := q.Get("at"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			at = t
		} else if ms, err := strconv.ParseInt(v, 10, 64); err == nil {
			at = time.UnixMilli(ms)
		} else {
			errJSON(w, http.StatusBadRequest, "at must be RFC 3339 or ms epoch")
			return
		}
	}
	opts := schedule.JourneyOptions(s.data.Timetable, s.data.Run, from, to, at, 3, s.data.Fares, s.data.Holidays)
	writeJSON(w, http.StatusOK, model.JourneyResponse{From: from, To: to, Options: opts})
}

// GET /v1/trains — live tracks plus merged timetable estimates (debug/web).
func (s *Server) trains(w http.ResponseWriter, r *http.Request) {
	now := s.now()
	live := s.engine.Snapshot(now)
	est := fusion.MergeEstimates(live, schedule.EstimatedTrains(s.data.Timetable, s.data.Run, nil, now, s.data.Holidays), 300)
	writeJSON(w, http.StatusOK, map[string]any{"ts": now.UnixMilli(), "live": live, "estimated": est})
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
