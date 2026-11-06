// Package schedule is the timetable engine (spec §4.2, §4.4, §6.4, §6.5).
// Pure functions, mirrored by frontend/src/lib/schedule.ts and cross-tested
// against testdata/schedule_cases.json.
package schedule

import (
	"fmt"
	"math"
	"sort"
	"time"

	"github.com/metrokoi/backend/internal/geo"
	"github.com/metrokoi/backend/internal/model"
)

// Dhaka is UTC+6 with no DST.
var Dhaka = time.FixedZone("Asia/Dhaka", 6*3600)

// NominalLineM is used only when OSM chainage is missing (spec §18.1).
const NominalLineM = 21260.0

func HHMMToSec(s string) int {
	var h, m int
	fmt.Sscanf(s, "%d:%d", &h, &m)
	return h*3600 + m*60
}

func SecToHHMM(sec int) string {
	s := ((sec % 86400) + 86400) % 86400
	return fmt.Sprintf("%02d:%02d", s/3600, (s%3600)/60)
}

// Clock is the Dhaka-local view of an instant.
type Clock struct {
	DateKey string
	Weekday time.Weekday
	Sec     float64
}

func DhakaClock(now time.Time) Clock {
	t := now.In(Dhaka)
	return Clock{
		DateKey: t.Format("2006-01-02"),
		Weekday: t.Weekday(),
		Sec:     float64(t.Hour()*3600+t.Minute()*60+t.Second()) + float64(t.Nanosecond())/1e9,
	}
}

// DayTypeFor maps a Dhaka-local date to a day type (spec §4.1).
func DayTypeFor(now time.Time, holidays map[string]bool) model.DayType {
	c := DhakaClock(now)
	switch {
	case holidays[c.DateKey]:
		return model.Holiday
	case c.Weekday == time.Friday:
		return model.Fri
	case c.Weekday == time.Saturday:
		return model.Sat
	default:
		return model.SunThu
	}
}

// TerminalDepartures: from, from+h, … ≤ to; the next band's start replaces
// the previous band (spec §4.2).
func TerminalDepartures(tt *model.Timetable, day model.DayType, dir model.Direction) []model.TerminalDeparture {
	bands := tt.BandList(day, dir)
	var out []model.TerminalDeparture
	for i, b := range bands {
		start, end := HHMMToSec(b.From), HHMMToSec(b.To)
		next := math.MaxInt
		if i+1 < len(bands) {
			next = HHMMToSec(bands[i+1].From)
		}
		for t := start; t <= end && t < next; t += b.HeadwayMin * 60 {
			hhmm := SecToHHMM(t)
			out = append(out, model.TerminalDeparture{Direction: dir, DepartSec: t, TrainID: string(dir) + "-" + hhmm[:2] + hhmm[3:]})
		}
	}
	return out
}

// ServiceWindow is the earliest band start and latest band end of the day.
func ServiceWindow(tt *model.Timetable, day model.DayType) (first, last int) {
	first, last = math.MaxInt, 0
	for _, d := range []model.Direction{model.SB, model.NB} {
		for _, b := range tt.BandList(day, d) {
			first = min(first, HHMMToSec(b.From))
			last = max(last, HHMMToSec(b.To))
		}
	}
	return
}

// RunModel holds per-station SB offsets from the terminal departure (spec §4.4).
type RunModel struct {
	StationIDs     []string
	Chainage       []float64
	LengthM        float64
	Arrive, Depart []float64
	EndToEndSec    float64
	DwellSec       float64
	ApproxGeometry bool
}

// OpenStations returns open stations sorted north → south.
func OpenStations(all []model.Station) []model.Station {
	var out []model.Station
	for _, s := range all {
		if s.Status == model.StationOpen {
			out = append(out, s)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Order < out[j].Order })
	return out
}

// SegmentOverride is a learned run time (seconds) for station i-1 → i,
// used once it has ≥ 30 samples (spec §4.4).
type SegmentOverride map[int]float64

func BuildRunModel(all []model.Station, endToEndMin, dwellSec float64, learned SegmentOverride) *RunModel {
	open := OpenStations(all)
	n := len(open)
	m := &RunModel{EndToEndSec: endToEndMin * 60, DwellSec: dwellSec}
	have := true
	for _, s := range open {
		m.StationIDs = append(m.StationIDs, s.ID)
		if s.ChainageM == nil {
			have = false
		}
	}
	for i, s := range open {
		if have {
			m.Chainage = append(m.Chainage, *s.ChainageM)
		} else {
			m.Chainage = append(m.Chainage, float64(i)*NominalLineM/float64(n-1))
		}
	}
	m.ApproxGeometry = !have
	m.LengthM = m.Chainage[n-1] - m.Chainage[0]
	moving := m.EndToEndSec - dwellSec*float64(n-2)
	m.Arrive = make([]float64, n)
	m.Depart = make([]float64, n)
	for i := 1; i < n; i++ {
		seg := (m.Chainage[i] - m.Chainage[i-1]) / m.LengthM * moving
		if v, ok := learned[i]; ok {
			seg = v
		}
		m.Arrive[i] = m.Depart[i-1] + seg
		if i == n-1 {
			m.Depart[i] = m.Arrive[i]
		} else {
			m.Depart[i] = m.Arrive[i] + dwellSec
		}
	}
	if len(learned) == 0 {
		// pin the terminus exactly (float drift would hide the NB start station)
		m.Arrive[n-1], m.Depart[n-1] = m.EndToEndSec, m.EndToEndSec
	} else {
		m.EndToEndSec = m.Arrive[n-1]
	}
	return m
}

// Offsets for station index i (always in north → south index order).
func (m *RunModel) Offsets(dir model.Direction, i int) (arrive, depart float64) {
	if dir == model.SB {
		return m.Arrive[i], m.Depart[i]
	}
	return m.EndToEndSec - m.Depart[i], m.EndToEndSec - m.Arrive[i]
}

func (m *RunModel) Index(stationID string) int {
	for i, id := range m.StationIDs {
		if id == stationID {
			return i
		}
	}
	return -1
}

// Position of a train `elapsed` seconds after leaving its terminal.
type Position struct {
	S          float64
	AtStation  int // -1 when moving
	NextIdx    int // -1 at the end
	EtaNextSec float64
	V          float64
}

func (m *RunModel) PositionAt(dir model.Direction, elapsed float64) (Position, bool) {
	if elapsed < 0 || elapsed > m.EndToEndSec {
		return Position{}, false
	}
	n := len(m.StationIDs)
	order := make([]int, n)
	for k := range order {
		if dir == model.SB {
			order[k] = k
		} else {
			order[k] = n - 1 - k
		}
	}
	sign := 1.0
	if dir == model.NB {
		sign = -1
	}
	for k := 0; k < n; k++ {
		i := order[k]
		arr, dep := m.Offsets(dir, i)
		next := -1
		if k+1 < n {
			next = order[k+1]
		}
		if elapsed >= arr && elapsed <= dep {
			eta := 0.0
			if next >= 0 {
				na, _ := m.Offsets(dir, next)
				eta = na - elapsed
			}
			return Position{S: m.Chainage[i], AtStation: i, NextIdx: next, EtaNextSec: eta}, true
		}
		if next >= 0 {
			na, _ := m.Offsets(dir, next)
			if elapsed > dep && elapsed < na {
				f := (elapsed - dep) / (na - dep)
				ds := m.Chainage[next] - m.Chainage[i]
				return Position{S: m.Chainage[i] + f*ds, AtStation: -1, NextIdx: next, EtaNextSec: na - elapsed, V: sign * math.Abs(ds) / (na - dep)}, true
			}
		}
	}
	return Position{}, false
}

// EstimatedTrains are the scheduled trains running now, marked ESTIMATED.
func EstimatedTrains(tt *model.Timetable, m *RunModel, line *geo.Line, now time.Time, holidays map[string]bool) []model.Train {
	day := DayTypeFor(now, holidays)
	sec := DhakaClock(now).Sec
	var out []model.Train
	for _, dir := range []model.Direction{model.SB, model.NB} {
		for _, dep := range TerminalDepartures(tt, day, dir) {
			p, ok := m.PositionAt(dir, sec-float64(dep.DepartSec))
			if !ok {
				continue
			}
			t := model.Train{ID: dep.TrainID, Dir: dir, S: round1(p.S), V: round1(p.V), State: model.StateEstimated}
			if p.NextIdx >= 0 {
				id := m.StationIDs[p.NextIdx]
				eta := int(math.Round(p.EtaNextSec))
				t.NextStation, t.EtaSec = &id, &eta
			}
			if line != nil && !m.ApproxGeometry {
				lat, lng, brg := line.PointAt(p.S)
				if dir == model.NB {
					brg = math.Mod(brg+180, 360)
				}
				t.Lat, t.Lng, t.Hdg = &lat, &lng, &brg
			}
			out = append(out, t)
		}
	}
	return out
}

// StationDepartures lists the next scheduled trains per direction.
func StationDepartures(tt *model.Timetable, m *RunModel, stationID string, now time.Time, limit int, holidays map[string]bool) map[model.Direction][]model.Departure {
	res := map[model.Direction][]model.Departure{model.SB: {}, model.NB: {}}
	i := m.Index(stationID)
	if i < 0 {
		return res
	}
	day := DayTypeFor(now, holidays)
	sec := DhakaClock(now).Sec
	last := len(m.StationIDs) - 1
	for _, dir := range []model.Direction{model.SB, model.NB} {
		if (dir == model.SB && i == last) || (dir == model.NB && i == 0) {
			continue
		}
		arr, dep := m.Offsets(dir, i)
		for _, d := range TerminalDepartures(tt, day, dir) {
			if float64(d.DepartSec)+dep < sec {
				continue
			}
			at := float64(d.DepartSec) + arr
			res[dir] = append(res[dir], model.Departure{
				TrainID: d.TrainID, Direction: dir, Platform: model.PlatformFor(dir),
				EtaSec: max(0, int(math.Round(at-sec))), Source: model.SourceSchedule, AtSec: int(math.Round(at)),
			})
			if len(res[dir]) >= limit {
				break
			}
		}
	}
	return res
}

// FareFor looks up a fare in either direction; nil when the chart is missing.
func FareFor(f *model.FaresFile, from, to string) *int {
	if f == nil || f.Amounts == nil {
		return nil
	}
	if v, ok := f.Amounts[from+"|"+to]; ok {
		return &v
	}
	if v, ok := f.Amounts[to+"|"+from]; ok {
		return &v
	}
	return nil
}

// JourneyOptions returns the next `count` trains From → To (spec §10.6).
func JourneyOptions(tt *model.Timetable, m *RunModel, from, to string, now time.Time, count int, fares *model.FaresFile, holidays map[string]bool) []model.JourneyOption {
	a, b := m.Index(from), m.Index(to)
	if a < 0 || b < 0 || a == b {
		return []model.JourneyOption{}
	}
	dir := model.NB
	if b > a {
		dir = model.SB
	}
	day := DayTypeFor(now, holidays)
	sec := DhakaClock(now).Sec
	_, fromDep := m.Offsets(dir, a)
	toArr, _ := m.Offsets(dir, b)
	fare := FareFor(fares, from, to)
	var rp *int
	if fare != nil {
		v := int(math.Round(float64(*fare) * fares.RapidPassMultiplier))
		rp = &v
	}
	out := []model.JourneyOption{}
	for _, d := range TerminalDepartures(tt, day, dir) {
		leave := float64(d.DepartSec) + fromDep
		if leave < sec {
			continue
		}
		arrive := float64(d.DepartSec) + toArr
		out = append(out, model.JourneyOption{
			TrainID: d.TrainID, Direction: dir,
			DepartSec: int(math.Round(leave)), ArriveSec: int(math.Round(arrive)),
			DurationSec: int(math.Round(arrive - leave)), WaitSec: int(math.Round(leave - sec)),
			FareBDT: fare, FareRapidPassBDT: rp, Source: model.SourceSchedule,
		})
		if len(out) >= count {
			break
		}
	}
	return out
}

// ETAToStation for a moving train (spec §6.5). ok=false if the station is behind.
func (m *RunModel) ETAToStation(dir model.Direction, s float64, stationID string) (int, bool) {
	i := m.Index(stationID)
	if i < 0 {
		return 0, false
	}
	ahead := m.Chainage[i] - s
	if dir == model.NB {
		ahead = s - m.Chainage[i]
	}
	if ahead < 0 {
		return 0, false
	}
	avg := m.LengthM / (m.EndToEndSec - m.DwellSec*float64(len(m.StationIDs)-2))
	dwells := 0
	for k := 1; k < len(m.Chainage)-1; k++ {
		d := m.Chainage[k] - s
		if dir == model.NB {
			d = s - m.Chainage[k]
		}
		if d > 1 && d < ahead {
			dwells++
		}
	}
	return int(math.Round(ahead/avg + float64(dwells)*m.DwellSec)), true
}

// NextStationIdx returns the next station ahead of chainage s in direction dir.
func (m *RunModel) NextStationIdx(dir model.Direction, s float64) int {
	if dir == model.SB {
		for i, c := range m.Chainage {
			if c > s+20 {
				return i
			}
		}
		return -1
	}
	for i := len(m.Chainage) - 1; i >= 0; i-- {
		if m.Chainage[i] < s-20 {
			return i
		}
	}
	return -1
}

func round1(v float64) float64 { return math.Round(v*10) / 10 }
