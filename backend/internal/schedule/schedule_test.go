package schedule

import (
	"encoding/json"
	"math"
	"os"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/metrokoi/backend/data"
	"github.com/metrokoi/backend/internal/model"
)

type golden struct {
	Cases []struct {
		DayType   model.DayType   `json:"dayType"`
		Direction model.Direction `json:"direction"`
		Count     int             `json:"count"`
		First     string          `json:"first"`
		Last      string          `json:"last"`
		Sample    []string        `json:"sample"`
	} `json:"cases"`
	MustContain    map[string][]string `json:"mustContain"`
	MustNotContain map[string][]string `json:"mustNotContain"`
	PeakSunThuSB   []string            `json:"peakSunThuSB"`
}

func load(t *testing.T) (*model.Timetable, []model.Station, golden) {
	t.Helper()
	var tt model.Timetable
	if err := json.Unmarshal(data.Timetable, &tt); err != nil {
		t.Fatal(err)
	}
	var sf model.StationsFile
	if err := json.Unmarshal(data.Stations, &sf); err != nil {
		t.Fatal(err)
	}
	b, err := os.ReadFile("../../testdata/schedule_cases.json")
	if err != nil {
		t.Fatal(err)
	}
	var g golden
	if err := json.Unmarshal(b, &g); err != nil {
		t.Fatal(err)
	}
	return &tt, sf.Stations, g
}

func times(tt *model.Timetable, d model.DayType, dir model.Direction) []string {
	var out []string
	for _, x := range TerminalDepartures(tt, d, dir) {
		out = append(out, SecToHHMM(x.DepartSec))
	}
	return out
}

func TestGoldenVectors(t *testing.T) {
	tt, _, g := load(t)
	for _, c := range g.Cases {
		got := times(tt, c.DayType, c.Direction)
		if len(got) != c.Count || got[0] != c.First || got[len(got)-1] != c.Last || !slices.Equal(got[:4], c.Sample) {
			t.Errorf("%s/%s: count %d first %s last %s sample %v", c.DayType, c.Direction, len(got), got[0], got[len(got)-1], got[:4])
		}
	}
	check := func(m map[string][]string, want bool) {
		for k, list := range m {
			p := strings.Split(k, "/")
			got := times(tt, model.DayType(p[0]), model.Direction(p[1]))
			for _, v := range list {
				if slices.Contains(got, v) != want {
					t.Errorf("%s contains %s = %v, want %v", k, v, !want, want)
				}
			}
		}
	}
	check(g.MustContain, true)
	check(g.MustNotContain, false)
	peak := times(tt, model.SunThu, model.SB)
	for _, v := range g.PeakSunThuSB {
		if !slices.Contains(peak, v) {
			t.Errorf("peak missing %s", v)
		}
	}
}

func TestDayType(t *testing.T) {
	sun := time.Date(2026, 11, 8, 2, 20, 0, 0, time.UTC) // Sunday 08:20 Dhaka
	if DayTypeFor(sun, nil) != model.SunThu {
		t.Fatal("sunday")
	}
	if DayTypeFor(time.Date(2026, 11, 6, 23, 30, 0, 0, time.UTC), nil) != model.Sat {
		t.Fatal("23:30Z Friday is Saturday in Dhaka")
	}
	if DayTypeFor(sun, map[string]bool{"2026-11-08": true}) != model.Holiday {
		t.Fatal("holiday")
	}
	tt, _, _ := load(t)
	if !slices.Equal(times(tt, model.Holiday, model.SB), times(tt, model.Fri, model.SB)) {
		t.Fatal("holiday should follow Friday")
	}
}

func TestRunModelWithOSMChainage(t *testing.T) {
	tt, st, _ := load(t)
	m := BuildRunModel(st, tt.EndToEndMin, tt.DwellSec, nil)
	if len(m.StationIDs) != 16 || m.ApproxGeometry {
		t.Fatalf("stations %d approx %v", len(m.StationIDs), m.ApproxGeometry)
	}
	if m.Arrive[15] != 2400 || m.Depart[0] != 0 {
		t.Fatalf("end-to-end %v", m.Arrive[15])
	}
	if p, ok := m.PositionAt(model.NB, 0); !ok || p.AtStation != 15 {
		t.Fatalf("NB start %+v", p)
	}
	if p, ok := m.PositionAt(model.SB, 0); !ok || p.AtStation != 0 {
		t.Fatalf("SB start %+v", p)
	}
	// segment time proportional to length
	r1 := (m.Arrive[1] - m.Depart[0]) / (m.Chainage[1] - m.Chainage[0])
	r2 := (m.Arrive[5] - m.Depart[4]) / (m.Chainage[5] - m.Chainage[4])
	if math.Abs(r1-r2) > 1e-9 {
		t.Fatal("segment speed should be uniform")
	}
}

func TestDeparturesAndJourney(t *testing.T) {
	tt, st, _ := load(t)
	m := BuildRunModel(st, tt.EndToEndMin, tt.DwellSec, nil)
	now := time.Date(2026, 11, 8, 2, 20, 0, 0, time.UTC)
	d := StationDepartures(tt, m, "farmgate", now, 3, nil)
	if len(d[model.SB]) != 3 || d[model.SB][0].Platform != 1 || len(d[model.NB]) != 3 || d[model.NB][0].Platform != 2 {
		t.Fatalf("departures %+v", d)
	}
	if len(StationDepartures(tt, m, "motijheel", now, 3, nil)[model.SB]) != 0 {
		t.Fatal("no SB departures at Motijheel")
	}
	j := JourneyOptions(tt, m, "mirpur-10", "farmgate", now, 3, nil, nil)
	if len(j) != 3 || j[0].Direction != model.SB || j[0].FareBDT != nil || j[0].DurationSec <= 0 {
		t.Fatalf("journey %+v", j)
	}
	if len(EstimatedTrains(tt, m, nil, now, nil)) < 5 {
		t.Fatal("expected several active trains at 08:20")
	}
}
