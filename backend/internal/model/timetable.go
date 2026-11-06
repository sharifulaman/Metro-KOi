package model

// DayType per spec §4.1; Holiday resolves to Timetable.HolidayAs (default fri).
type DayType string

const (
	SunThu  DayType = "sun_thu"
	Fri     DayType = "fri"
	Sat     DayType = "sat"
	Holiday DayType = "holiday"
)

// Direction: SB = Uttara North → Motijheel, NB = Motijheel → Uttara North.
type Direction string

const (
	SB Direction = "SB"
	NB Direction = "NB"
)

// BandTuple is ["HH:mm", "HH:mm", headwayMin] as published (spec §4.2).
type BandTuple [3]any

// HeadwayBand is one row of table `timetable_bands`.
type HeadwayBand struct {
	DayType    DayType   `json:"dayType"`
	Direction  Direction `json:"direction"`
	From       string    `json:"from"`
	To         string    `json:"to"`
	HeadwayMin int       `json:"headwayMin"`
}

// Timetable is data/timetable.json and the body of GET /v1/timetable.
type Timetable struct {
	Source      string                                   `json:"source"`
	VerifiedAt  string                                   `json:"verifiedAt"`
	Version     string                                   `json:"version"`
	HolidayAs   DayType                                  `json:"holidayAs"`
	EndToEndMin float64                                  `json:"endToEndMin"`
	DwellSec    float64                                  `json:"dwellSec"`
	Bands       map[DayType]map[Direction][][3]jsonValue `json:"bands"`
}

// jsonValue lets a band tuple hold strings and numbers.
type jsonValue = any

// Band returns band i for (day, dir) as a typed HeadwayBand.
func (t *Timetable) BandList(day DayType, dir Direction) []HeadwayBand {
	if day == Holiday {
		day = t.HolidayAs
	}
	rows := t.Bands[day][dir]
	out := make([]HeadwayBand, 0, len(rows))
	for _, r := range rows {
		from, _ := r[0].(string)
		to, _ := r[1].(string)
		h, _ := r[2].(float64)
		out = append(out, HeadwayBand{DayType: day, Direction: dir, From: from, To: to, HeadwayMin: int(h)})
	}
	return out
}

// TerminalDeparture is a generated departure from a terminal.
type TerminalDeparture struct {
	Direction Direction `json:"direction"`
	DepartSec int       `json:"departSec"` // seconds after local midnight
	TrainID   string    `json:"trainId"`
}

// SegmentStat is table `segment_stats`: learned median run time.
type SegmentStat struct {
	FromStation string  `json:"fromStation"`
	ToStation   string  `json:"toStation"`
	Hour        int     `json:"hour"`
	Samples     int     `json:"samples"`
	MedianSec   float64 `json:"medianSec"`
}
