// Package fusion turns rider GPS fixes into live train tracks (spec §6.1–6.3).
// One mutex-guarded engine per process; Tick runs at 1 Hz.
package fusion

import (
	"errors"
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/metrokoi/backend/internal/geo"
	"github.com/metrokoi/backend/internal/model"
	"github.com/metrokoi/backend/internal/schedule"
)

// Config holds every threshold from the spec, so tests and ops can tune them.
type Config struct {
	MaxAccuracyM      float64       // reject fix if accuracy > 30 m
	MaxOffsetM        float64       // reject if > 40 m from the line
	MaxFixAge         time.Duration // reject fixes older than 10 s
	MaxSpeedMps       float64       // reject > 100 km/h
	MinFixInterval    time.Duration // max 1 fix per 2 s per session
	MinScore          int           // client score needed to share (≥ 3)
	MaxSessionsPerDay int           // per device
	DirMinFixes       int           // ≥ 3 accepted fixes …
	DirMinSpanM       float64       // … spanning ≥ 40 m decide direction
	AssocM            float64       // join a track within 150 m of its prediction
	OutlierM          float64       // detach rider > 200 m off the track …
	OutlierAfter      time.Duration // … after ≥ 5 s on it
	ProcessNoise      float64       // q, m/s²
	LiveWindow        time.Duration // LIVE: rider data within 15 s
	StaleWindow       time.Duration // STALE: 15–60 s
	DropAfter         time.Duration // drop after 3 min without data
	TrainSpeedMps     float64       // ≥ 40 km/h between stations confirms a train
	StationRadiusM    float64       // ±80 m counts as "at a station"
	OffStationStop    time.Duration // stopped this long away from a station ⇒ not a train
	MaxSession        time.Duration // auto-end after 90 min
}

func DefaultConfig() Config {
	return Config{
		MaxAccuracyM: 30, MaxOffsetM: 40, MaxFixAge: 10 * time.Second, MaxSpeedMps: 100 / 3.6,
		MinFixInterval: 2 * time.Second, MinScore: 3, MaxSessionsPerDay: 3,
		DirMinFixes: 3, DirMinSpanM: 40, AssocM: 150, OutlierM: 200, OutlierAfter: 5 * time.Second,
		ProcessNoise: 0.5, LiveWindow: 15 * time.Second, StaleWindow: 60 * time.Second, DropAfter: 3 * time.Minute,
		TrainSpeedMps: 40 / 3.6, StationRadiusM: 80, OffStationStop: 15 * time.Second, MaxSession: 90 * time.Minute,
	}
}

var (
	ErrLowScore     = errors.New("score below threshold")
	ErrTooMany      = errors.New("too many sessions for device today")
	ErrNoSession    = errors.New("unknown session")
	ErrNoGeometry   = errors.New("line geometry not loaded")
)

// Track is one train inferred from riders (spec §6.3).
type Track struct {
	ID         string
	Dir        model.Direction
	S, V       float64       // Kalman state: chainage (m), velocity (m/s, signed)
	P          [2][2]float64 // covariance
	LastUpdate time.Time
	Riders     map[string]time.Time // sessionID → last fix on this track
	Created    time.Time
	Confirmed  bool // moved like a train
	speedSeen  bool
	stopStart  time.Time // when the track came to a halt (zero if moving)
	stopS      float64
	suspicious bool
	published  bool
}

type session struct {
	model.RiderSession
	trackJoined time.Time
	// untrusted sessions rode a track flagged as road traffic: their fixes are
	// still accepted (silently) but never fused again (spec §7.2 "drop and flag").
	untrusted bool
}

// Engine is safe for concurrent use.
type Engine struct {
	mu       sync.Mutex
	cfg      Config
	line     *geo.Line
	run      *schedule.RunModel
	sessions map[string]*session
	devices  map[string][]time.Time
	tracks   map[string]*Track
	seq      int

	// OnAccept is called (outside the lock) for every accepted fix, e.g. to
	// persist chainage to raw_fixes. OnReject receives the reason (metrics).
	OnAccept func(model.SnappedFix)
	OnReject func(model.RejectReason)
}

func New(cfg Config, line *geo.Line, run *schedule.RunModel) *Engine {
	return &Engine{cfg: cfg, line: line, run: run, sessions: map[string]*session{}, devices: map[string][]time.Time{}, tracks: map[string]*Track{}}
}

// StartSession registers a sharing session (rider.start).
func (e *Engine) StartSession(sessionID, deviceID string, score int, now time.Time) error {
	if e.line == nil {
		return ErrNoGeometry
	}
	if score < e.cfg.MinScore {
		return ErrLowScore
	}
	e.mu.Lock()
	defer e.mu.Unlock()
	if _, ok := e.sessions[sessionID]; ok {
		return nil
	}
	recent := e.devices[deviceID][:0]
	for _, t := range e.devices[deviceID] {
		if now.Sub(t) < 24*time.Hour {
			recent = append(recent, t)
		}
	}
	if len(recent) >= e.cfg.MaxSessionsPerDay {
		e.devices[deviceID] = recent
		return ErrTooMany
	}
	e.devices[deviceID] = append(recent, now)
	e.sessions[sessionID] = &session{RiderSession: model.RiderSession{SessionID: sessionID, DeviceID: deviceID, Score: score, StartedAt: now}}
	return nil
}

// StopSession ends a session (rider.stop) and detaches it from its track.
func (e *Engine) StopSession(sessionID string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.stopLocked(sessionID)
}

func (e *Engine) stopLocked(id string) {
	if s, ok := e.sessions[id]; ok {
		if t := e.tracks[s.TrackID]; t != nil {
			delete(t.Riders, id)
		}
		delete(e.sessions, id)
	}
}

// Ingest validates, snaps and fuses one fix (rider.fix).
func (e *Engine) Ingest(f model.Fix, recv time.Time) (bool, model.RejectReason) {
	ok, reason, snapped := e.ingest(f, recv)
	if ok && e.OnAccept != nil {
		e.OnAccept(snapped)
	}
	if !ok && e.OnReject != nil {
		e.OnReject(reason)
	}
	return ok, reason
}

func (e *Engine) ingest(f model.Fix, recv time.Time) (bool, model.RejectReason, model.SnappedFix) {
	e.mu.Lock()
	defer e.mu.Unlock()
	s, ok := e.sessions[f.SessionID]
	if !ok {
		return false, model.RejectSession, model.SnappedFix{}
	}
	if recv.Sub(s.StartedAt) > e.cfg.MaxSession {
		e.stopLocked(f.SessionID)
		return false, model.RejectSession, model.SnappedFix{}
	}
	if !s.LastFixAt.IsZero() && recv.Sub(s.LastFixAt) < e.cfg.MinFixInterval {
		return false, model.RejectRate, model.SnappedFix{}
	}
	ts := time.UnixMilli(f.TS)
	switch {
	case f.Acc > e.cfg.MaxAccuracyM:
		return false, model.RejectAccuracy, model.SnappedFix{}
	case recv.Sub(ts) > e.cfg.MaxFixAge:
		return false, model.RejectStale, model.SnappedFix{}
	case f.Spd > e.cfg.MaxSpeedMps:
		return false, model.RejectSpeed, model.SnappedFix{}
	}
	ch, off := e.line.Snap(f.Lat, f.Lng)
	if off > e.cfg.MaxOffsetM {
		return false, model.RejectOffset, model.SnappedFix{}
	}
	sf := model.SnappedFix{Fix: f, ChainageM: ch, LateralOffsetM: off, Received: recv}
	s.LastFixAt = recv
	s.History = append(s.History, sf)
	if len(s.History) > 20 {
		s.History = s.History[len(s.History)-20:]
	}
	if s.Direction == "" {
		s.Direction = direction(s.History, e.cfg.DirMinFixes, e.cfg.DirMinSpanM)
		if s.Direction == "" {
			return true, "", sf // accepted, but not yet on a track
		}
	}
	if !s.untrusted {
		e.associate(s, sf, ts)
	}
	return true, "", sf
}

// direction: sign of chainage change over the last ≥ N fixes spanning ≥ span m.
func direction(h []model.SnappedFix, n int, span float64) model.Direction {
	if len(h) < n {
		return ""
	}
	d := h[len(h)-1].ChainageM - h[len(h)-n].ChainageM
	switch {
	case d >= span:
		return model.SB
	case d <= -span:
		return model.NB
	}
	return ""
}

func (e *Engine) associate(s *session, f model.SnappedFix, ts time.Time) {
	// Outlier rule: a rider far from their own track for ≥ 5 s is detached.
	if t := e.tracks[s.TrackID]; t != nil {
		pred := t.S + t.V*ts.Sub(t.LastUpdate).Seconds()
		if math.Abs(pred-f.ChainageM) <= e.cfg.OutlierM || ts.Sub(s.trackJoined) < e.cfg.OutlierAfter {
			e.update(t, s, f, ts)
			return
		}
		delete(t.Riders, s.SessionID)
		s.TrackID = ""
		if e.OnReject != nil {
			go e.OnReject(model.RejectOutlier)
		}
	}
	var best *Track
	bestD := e.cfg.AssocM
	for _, t := range e.tracks {
		if t.Dir != s.Direction || t.suspicious {
			continue
		}
		pred := t.S + t.V*ts.Sub(t.LastUpdate).Seconds()
		if d := math.Abs(pred - f.ChainageM); d <= bestD {
			best, bestD = t, d
		}
	}
	if best == nil {
		e.seq++
		v := f.Spd
		if s.Direction == model.NB {
			v = -v
		}
		best = &Track{
			ID: fmt.Sprintf("T-%d", e.seq), Dir: s.Direction, S: f.ChainageM, V: v,
			P: [2][2]float64{{f.Acc * f.Acc, 0}, {0, 25}}, LastUpdate: ts, Created: ts, Riders: map[string]time.Time{},
		}
		e.tracks[best.ID] = best
		best.Riders[s.SessionID] = ts
		s.TrackID, s.trackJoined = best.ID, ts
		e.observe(best, f, ts)
		return
	}
	s.TrackID, s.trackJoined = best.ID, ts
	e.update(best, s, f, ts)
}

// update runs one Kalman predict + update step with r = acc².
func (e *Engine) update(t *Track, s *session, f model.SnappedFix, ts time.Time) {
	dt := ts.Sub(t.LastUpdate).Seconds()
	if dt < 0 {
		dt = 0 // out-of-order fix from another rider: update without predicting back
	}
	// predict
	q := e.cfg.ProcessNoise * e.cfg.ProcessNoise
	t.S += t.V * dt
	p := t.P
	p00 := p[0][0] + dt*(p[1][0]+p[0][1]) + dt*dt*p[1][1] + q*dt*dt*dt*dt/4
	p01 := p[0][1] + dt*p[1][1] + q*dt*dt*dt/2
	p11 := p[1][1] + q*dt*dt
	// update with H = [1 0]
	r := f.Acc * f.Acc
	// Validation gate: with other riders backing the track, a fix > 3σ from
	// the prediction is not fused (the outlier rule detaches it if it persists).
	if others := len(t.Riders) - btoi(t.Riders[s.SessionID] != time.Time{}); others >= 2 {
		if inn := math.Abs(f.ChainageM - t.S); inn > math.Max(40, 3*math.Sqrt(p00+r)) {
			t.S -= t.V * dt // undo the predict; state stays at LastUpdate
			return
		}
	}
	k0 := p00 / (p00 + r)
	k1 := p01 / (p00 + r)
	y := f.ChainageM - t.S
	t.S += k0 * y
	t.V += k1 * y
	t.P = [2][2]float64{{(1 - k0) * p00, (1 - k0) * p01}, {(1 - k0) * p01, p11 - k1*p01}}
	t.V = math.Max(-e.cfg.MaxSpeedMps, math.Min(e.cfg.MaxSpeedMps, t.V))
	if ts.After(t.LastUpdate) {
		t.LastUpdate = ts
	}
	t.Riders[s.SessionID] = ts
	e.observe(t, f, ts)
}

// observe applies the "moves like a train" checks (spec §6.2 server side).
// It uses the phone's own GPS speed, not the filter velocity: two road users
// merged into one track make the filter velocity jump, GPS speed does not.
func (e *Engine) observe(t *Track, f model.SnappedFix, ts time.Time) {
	atStation := e.nearStation(f.ChainageM)
	speed := f.Spd
	if speed >= e.cfg.TrainSpeedMps && !atStation {
		t.speedSeen = true
	}
	if speed < 1 {
		if t.stopStart.IsZero() {
			t.stopStart, t.stopS = ts, f.ChainageM
		} else if ts.Sub(t.stopStart) >= e.cfg.OffStationStop && !e.nearStation(t.stopS) {
			t.suspicious = true // stop-start between stations: road traffic, not a train
		}
	} else {
		t.stopStart = time.Time{}
	}
	t.Confirmed = t.speedSeen && !t.suspicious
}

func btoi(b bool) int {
	if b {
		return 1
	}
	return 0
}

func (e *Engine) nearStation(s float64) bool {
	for _, c := range e.run.Chainage {
		if math.Abs(c-s) <= e.cfg.StationRadiusM {
			return true
		}
	}
	return false
}

// Delta is what changed since the previous tick.
type Delta struct {
	Updated []model.Train
	Removed []string
}

// Tick expires riders/tracks and returns trains to publish (≤ 1 update per train per second).
func (e *Engine) Tick(now time.Time) Delta {
	e.mu.Lock()
	defer e.mu.Unlock()
	var d Delta
	for id, s := range e.sessions {
		if now.Sub(s.StartedAt) > e.cfg.MaxSession || (!s.LastFixAt.IsZero() && now.Sub(s.LastFixAt) > e.cfg.DropAfter) {
			e.stopLocked(id)
		}
	}
	for id, t := range e.tracks {
		for sid, last := range t.Riders {
			if now.Sub(last) > e.cfg.StaleWindow {
				delete(t.Riders, sid)
			}
		}
		age := now.Sub(t.LastUpdate)
		if age > e.cfg.DropAfter || t.suspicious {
			if t.published {
				d.Removed = append(d.Removed, id)
			}
			for sid := range t.Riders {
				if s := e.sessions[sid]; s != nil {
					s.TrackID = ""
					s.untrusted = s.untrusted || t.suspicious
				}
			}
			delete(e.tracks, id)
			continue
		}
		if !t.Confirmed {
			continue
		}
		t.published = true
		d.Updated = append(d.Updated, e.wire(t, now))
	}
	sort.Slice(d.Updated, func(i, j int) bool { return d.Updated[i].ID < d.Updated[j].ID })
	return d
}

// Snapshot returns all published tracks (trains.snapshot on connect).
func (e *Engine) Snapshot(now time.Time) []model.Train {
	e.mu.Lock()
	defer e.mu.Unlock()
	out := []model.Train{}
	for _, t := range e.tracks {
		if t.Confirmed && t.published {
			out = append(out, e.wire(t, now))
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

// wire predicts the track to `now` and builds the wire shape.
func (e *Engine) wire(t *Track, now time.Time) model.Train {
	age := now.Sub(t.LastUpdate)
	state := model.StateLive
	if age > e.cfg.LiveWindow {
		state = model.StateStale
	}
	s := t.S + t.V*math.Max(0, age.Seconds())
	next := e.run.NextStationIdx(t.Dir, t.S)
	if next >= 0 && state == model.StateStale {
		// keep predicting, but never run through the next station (dwell expected)
		c := e.run.Chainage[next]
		if (t.Dir == model.SB && s > c) || (t.Dir == model.NB && s < c) {
			s = c
		}
	}
	s = math.Max(0, math.Min(e.run.LengthM, s))
	riders := 0
	for _, last := range t.Riders {
		if now.Sub(last) <= e.cfg.LiveWindow {
			riders++
		}
	}
	out := model.Train{ID: t.ID, Dir: t.Dir, S: math.Round(s*10) / 10, V: math.Round(t.V*10) / 10, State: state, Riders: riders}
	lat, lng, brg := e.line.PointAt(s)
	if t.Dir == model.NB {
		brg = math.Mod(brg+180, 360)
	}
	out.Lat, out.Lng, out.Hdg = &lat, &lng, &brg
	if n := e.run.NextStationIdx(t.Dir, s); n >= 0 {
		id := e.run.StationIDs[n]
		out.NextStation = &id
		if eta, ok := e.run.ETAToStation(t.Dir, s, id); ok {
			out.EtaSec = &eta
		}
	}
	return out
}

// Counts for metrics.
func (e *Engine) Counts() (sessions int, byState map[model.TrainState]int) {
	e.mu.Lock()
	defer e.mu.Unlock()
	byState = map[model.TrainState]int{}
	now := time.Now()
	for _, t := range e.tracks {
		if !t.Confirmed {
			continue
		}
		if now.Sub(t.LastUpdate) > e.cfg.LiveWindow {
			byState[model.StateStale]++
		} else {
			byState[model.StateLive]++
		}
	}
	return len(e.sessions), byState
}

// MergeEstimates hides scheduled trains within `m` metres of a live/stale
// track in the same direction (spec §6.3 merge rule).
func MergeEstimates(live, est []model.Train, m float64) []model.Train {
	out := make([]model.Train, 0, len(est))
	for _, x := range est {
		hidden := false
		for _, l := range live {
			if l.Dir == x.Dir && math.Abs(l.S-x.S) <= m {
				hidden = true
				break
			}
		}
		if !hidden {
			out = append(out, x)
		}
	}
	return out
}
