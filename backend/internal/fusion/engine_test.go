package fusion

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand/v2"
	"testing"
	"time"

	"github.com/metrokoi/backend/data"
	"github.com/metrokoi/backend/internal/geo"
	"github.com/metrokoi/backend/internal/model"
	"github.com/metrokoi/backend/internal/schedule"
	"github.com/metrokoi/backend/internal/sim"
)

func setup(t *testing.T) (*geo.Line, *schedule.RunModel) {
	t.Helper()
	var lf model.LineFeature
	var sf model.StationsFile
	var tt model.Timetable
	for b, v := range map[*[]byte]any{&data.Line: &lf, &data.Stations: &sf, &data.Timetable: &tt} {
		if err := json.Unmarshal(*b, v); err != nil {
			t.Fatal(err)
		}
	}
	return geo.NewLine(lf.Geometry.Coordinates), schedule.BuildRunModel(sf.Stations, tt.EndToEndMin, tt.DwellSec, nil)
}

// Spec §14.3: synthetic ride with σ = 8 m noise and 5 s dwell jitter plus 30 %
// "bus below the viaduct" decoys. Decoys must be rejected; the train track
// must stay within ±40 m and appear as LIVE within 5 s of being confirmed.
func TestSimulatedRideWithDecoys(t *testing.T) {
	for seed := uint64(1); seed <= 8; seed++ {
		t.Run(fmt.Sprint("seed", seed), func(t *testing.T) { simulate(t, seed) })
	}
}

func simulate(t *testing.T, seed uint64) {
	line, run := setup(t)
	rng := rand.New(rand.NewPCG(seed, 11))
	e := New(DefaultConfig(), line, run)
	start := time.Date(2026, 11, 8, 2, 0, 0, 0, time.UTC)

	train := sim.NewTrain(run, model.SB, 19.4, 0.9, 30, rng)
	var riders []*sim.Rider
	for i := range 7 {
		riders = append(riders, sim.NewRider(fmt.Sprintf("train-%d", i), train, start, 0, 8, rng))
	}
	// 3 decoys (30 %): buses on the road under the viaduct, 15–25 m to the side.
	for i := range 3 {
		bus := sim.NewBus(run.Chainage[4]+float64(i)*400, run.Chainage[9], 5+rng.Float64()*3, rng)
		riders = append(riders, sim.NewRider(fmt.Sprintf("bus-%d", i), bus, start, 15+rng.Float64()*10, 8, rng))
	}
	for _, r := range riders {
		if err := e.StartSession(r.SessionID, r.DeviceID, 4, start); err != nil {
			t.Fatal(err)
		}
	}

	var maxErr float64
	var firstLive time.Time
	confirmedAt := time.Time{}
	liveIDs := map[string]bool{}
	for sec := 0; sec < 25*60; sec++ {
		now := start.Add(time.Duration(sec) * time.Second)
		for _, r := range riders {
			if (sec+int(r.SessionID[len(r.SessionID)-1]))%3 != 0 { // ~1 fix / 3 s
				continue
			}
			if f, _, ok := r.FixAt(line, now); ok {
				e.Ingest(f, now)
			}
		}
		d := e.Tick(now)
		trueS, _, ok := train.At(now.Sub(start).Seconds())
		for _, tr := range d.Updated {
			liveIDs[tr.ID] = true
			if tr.State != model.StateLive {
				continue
			}
			if firstLive.IsZero() {
				firstLive = now
			}
			if ok && now.Sub(firstLive) > 30*time.Second {
				maxErr = math.Max(maxErr, math.Abs(tr.S-trueS))
			}
		}
		if confirmedAt.IsZero() {
			for _, tk := range e.tracks {
				if tk.Confirmed {
					confirmedAt = now
				}
			}
		}
	}
	if firstLive.IsZero() {
		t.Fatal("train never became LIVE")
	}
	if firstLive.Sub(confirmedAt) > 5*time.Second {
		t.Fatalf("LIVE %v after confirmation", firstLive.Sub(confirmedAt))
	}
	if len(liveIDs) != 1 {
		t.Fatalf("expected exactly one published train, got %v (decoys leaked)", liveIDs)
	}
	if maxErr > 40 {
		t.Fatalf("track error %.1f m > 40 m", maxErr)
	}
	t.Logf("first LIVE after %v, max error %.1f m", firstLive.Sub(start), maxErr)
}

func TestFixValidation(t *testing.T) {
	line, run := setup(t)
	e := New(DefaultConfig(), line, run)
	now := time.Date(2026, 11, 8, 2, 0, 0, 0, time.UTC)
	if err := e.StartSession("s", "d", 2, now); err != ErrLowScore {
		t.Fatalf("low score: %v", err)
	}
	for i := range 3 {
		if err := e.StartSession(fmt.Sprint("s", i), "d", 3, now); err != nil {
			t.Fatal(err)
		}
	}
	if err := e.StartSession("s4", "d", 3, now); err != ErrTooMany {
		t.Fatalf("4th session: %v", err)
	}
	lat, lng, _ := line.PointAt(5000)
	fix := model.Fix{SessionID: "s0", Lat: lat, Lng: lng, Acc: 10, Spd: 15, TS: now.UnixMilli()}
	cases := []struct {
		name string
		mod  func(f *model.Fix)
		at   time.Time
		want model.RejectReason
	}{
		{"accuracy", func(f *model.Fix) { f.Acc = 31 }, now, model.RejectAccuracy},
		{"stale", func(f *model.Fix) { f.TS = now.Add(-11 * time.Second).UnixMilli() }, now, model.RejectStale},
		{"speed", func(f *model.Fix) { f.Spd = 30 }, now, model.RejectSpeed},
		{"offset", func(f *model.Fix) { f.Lng += 0.0006 }, now, model.RejectOffset}, // ~60 m east
		{"session", func(f *model.Fix) { f.SessionID = "nope" }, now, model.RejectSession},
	}
	for _, c := range cases {
		f := fix
		c.mod(&f)
		if ok, r := e.Ingest(f, c.at); ok || r != c.want {
			t.Errorf("%s: ok=%v reason=%s", c.name, ok, r)
		}
	}
	if ok, _ := e.Ingest(fix, now); !ok {
		t.Fatal("good fix rejected")
	}
	f2 := fix
	f2.TS = now.Add(time.Second).UnixMilli()
	if ok, r := e.Ingest(f2, now.Add(time.Second)); ok || r != model.RejectRate {
		t.Fatalf("rate limit: %v %s", ok, r)
	}
}

func TestMergeEstimates(t *testing.T) {
	live := []model.Train{{ID: "T-1", Dir: model.SB, S: 5000}}
	est := []model.Train{{ID: "SB-0800", Dir: model.SB, S: 5250}, {ID: "SB-0805", Dir: model.SB, S: 6000}, {ID: "NB-0800", Dir: model.NB, S: 5000}}
	got := MergeEstimates(live, est, 300)
	if len(got) != 2 || got[0].ID != "SB-0805" || got[1].ID != "NB-0800" {
		t.Fatalf("%+v", got)
	}
}
