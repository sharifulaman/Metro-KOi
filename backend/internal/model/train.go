package model

// Source of a number shown to users.
type Source string

const (
	SourceLive     Source = "live"
	SourceSchedule Source = "schedule"
)

// TrainState per spec §6.3.
type TrainState string

const (
	StateLive      TrainState = "LIVE"
	StateStale     TrainState = "STALE"
	StateEstimated TrainState = "ESTIMATED"
)

// Train is the wire shape in trains.snapshot / train.update (spec §7.2).
type Train struct {
	ID          string     `json:"id"`
	Dir         Direction  `json:"dir"`
	S           float64    `json:"s"`
	V           float64    `json:"v"`
	Lat         *float64   `json:"lat,omitempty"`
	Lng         *float64   `json:"lng,omitempty"`
	Hdg         *float64   `json:"hdg,omitempty"`
	State       TrainState `json:"state"`
	Riders      int        `json:"riders"`
	NextStation *string    `json:"nextStation,omitempty"`
	EtaSec      *int       `json:"etaSec,omitempty"`
}

// Departure is one upcoming train at a station (GET /stations/{id}/departures).
type Departure struct {
	TrainID   string    `json:"trainId,omitempty"`
	Direction Direction `json:"direction"`
	Platform  Platform  `json:"platform"`
	EtaSec    int       `json:"etaSec"`
	Source    Source    `json:"source"`
	AtSec     int       `json:"atSec"`
}

// DeparturesResponse groups departures per direction.
type DeparturesResponse struct {
	StationID string                    `json:"stationId"`
	DayType   DayType                   `json:"dayType"`
	ByDir     map[Direction][]Departure `json:"byDir"`
}
