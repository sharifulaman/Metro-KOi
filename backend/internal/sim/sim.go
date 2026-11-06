// Package sim generates synthetic rides along the real polyline (spec §14.3):
// trains with a trapezoid speed profile and station dwells, plus "bus below
// the viaduct" decoys that stop and start between stations.
package sim

import (
	"math"
	"math/rand/v2"
	"time"

	"github.com/metrokoi/backend/internal/geo"
	"github.com/metrokoi/backend/internal/model"
	"github.com/metrokoi/backend/internal/schedule"
)

// Profile of a simulated vehicle: chainage as a function of time.
type Profile interface {
	// At returns chainage (m) and speed (m/s, ≥ 0) t seconds after start; ok=false when done.
	At(t float64) (s, v float64, ok bool)
}

// Train runs station to station: accelerate, cruise, brake, dwell.
type Train struct {
	Stops     []float64 // chainages in travel order
	VMax, Acc float64
	Dwell     float64
	segs      []segment
}

type segment struct {
	start, from, to, tMove, dwell, vmax float64
}

func NewTrain(run *schedule.RunModel, dir model.Direction, vmax, acc, dwell float64, rng *rand.Rand) *Train {
	stops := append([]float64(nil), run.Chainage...)
	if dir == model.NB {
		for i, j := 0, len(stops)-1; i < j; i, j = i+1, j-1 {
			stops[i], stops[j] = stops[j], stops[i]
		}
	}
	tr := &Train{Stops: stops, VMax: vmax, Acc: acc, Dwell: dwell}
	t := 0.0
	for i := 1; i < len(stops); i++ {
		d := math.Abs(stops[i] - stops[i-1])
		v := math.Min(vmax, math.Sqrt(acc*d)) // triangle profile for short segments
		tMove := d/v + v/acc
		dw := dwell + rng.Float64()*10 - 5 // 5 s dwell jitter
		if i == len(stops)-1 {
			dw = 0
		}
		tr.segs = append(tr.segs, segment{start: t, from: stops[i-1], to: stops[i], tMove: tMove, dwell: dw, vmax: v})
		t += tMove + dw
	}
	return tr
}

func (tr *Train) At(t float64) (float64, float64, bool) {
	for _, g := range tr.segs {
		if t > g.start+g.tMove+g.dwell {
			continue
		}
		dt := t - g.start
		if dt < 0 {
			dt = 0
		}
		sign := 1.0
		if g.to < g.from {
			sign = -1
		}
		d := math.Abs(g.to - g.from)
		if dt >= g.tMove {
			return g.to, 0, true
		}
		ta := g.vmax / tr.Acc
		var x, v float64
		switch {
		case dt < ta:
			x, v = 0.5*tr.Acc*dt*dt, tr.Acc*dt
		case dt < g.tMove-ta:
			x, v = 0.5*tr.Acc*ta*ta+g.vmax*(dt-ta), g.vmax
		default:
			r := g.tMove - dt
			x, v = d-0.5*tr.Acc*r*r, tr.Acc*r
		}
		return g.from + sign*x, v, true
	}
	return 0, 0, false
}

// Bus drives the road under the viaduct: slow, with stops between stations.
type Bus struct {
	From, To float64
	Speed    float64
	stops    []struct{ at, dur float64 }
}

func NewBus(from, to, speed float64, rng *rand.Rand) *Bus {
	b := &Bus{From: from, To: to, Speed: speed}
	d := math.Abs(to - from)
	for x := 300 + rng.Float64()*300; x < d; x += 350 + rng.Float64()*400 {
		b.stops = append(b.stops, struct{ at, dur float64 }{x, 20 + rng.Float64()*40})
	}
	return b
}

func (b *Bus) At(t float64) (float64, float64, bool) {
	sign := 1.0
	if b.To < b.From {
		sign = -1
	}
	x, clock := 0.0, 0.0
	for _, st := range b.stops {
		drive := (st.at - x) / b.Speed
		if t < clock+drive {
			return b.From + sign*(x+(t-clock)*b.Speed), b.Speed, true
		}
		clock += drive
		x = st.at
		if t < clock+st.dur {
			return b.From + sign*x, 0, true
		}
		clock += st.dur
	}
	rest := math.Abs(b.To-b.From) - x
	if t < clock+rest/b.Speed {
		return b.From + sign*(x+(t-clock)*b.Speed), b.Speed, true
	}
	return 0, 0, false
}

// Rider turns a profile into noisy GPS fixes.
type Rider struct {
	SessionID string
	DeviceID  string
	Profile   Profile
	Start     time.Time
	Lateral   float64 // metres to the side of the line (0 for train riders)
	SigmaM    float64 // GPS noise σ (spec: 8 m)
	rng       *rand.Rand
}

func NewRider(id string, p Profile, start time.Time, lateral, sigma float64, rng *rand.Rand) *Rider {
	return &Rider{SessionID: id, DeviceID: "dev-" + id, Profile: p, Start: start, Lateral: lateral, SigmaM: sigma, rng: rng}
}

// FixAt returns the fix the phone would report at wall time now.
func (r *Rider) FixAt(line *geo.Line, now time.Time) (model.Fix, float64, bool) {
	s, v, ok := r.Profile.At(now.Sub(r.Start).Seconds())
	if !ok {
		return model.Fix{}, 0, false
	}
	lat, lng, brg := line.PointAt(s)
	// lateral offset (perpendicular) + Gaussian noise, in metres → degrees
	perp := (brg + 90) * math.Pi / 180
	dn := r.Lateral*math.Cos(perp) + r.rng.NormFloat64()*r.SigmaM
	de := r.Lateral*math.Sin(perp) + r.rng.NormFloat64()*r.SigmaM
	lat += dn / 111320
	lng += de / (111320 * math.Cos(lat*math.Pi/180))
	acc := 6 + r.rng.Float64()*8
	return model.Fix{SessionID: r.SessionID, Lat: lat, Lng: lng, Acc: acc, Spd: math.Max(0, v+r.rng.NormFloat64()*0.5), Hdg: brg, TS: now.UnixMilli()}, s, true
}
