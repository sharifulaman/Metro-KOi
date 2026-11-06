package model

// Gate letter A–D; Corner of the nearest intersection (spec §18.2).
type Gate string
type Corner string

const (
	GateA Gate = "A"
	GateB Gate = "B"
	GateC Gate = "C"
	GateD Gate = "D"
)

// DefaultCorner: A=NW, B=NE, C=SW, D=SE (override per station).
var DefaultCorner = map[Gate]Corner{GateA: "NW", GateB: "NE", GateC: "SW", GateD: "SE"}

// StationGate is one entry/exit (table `station_gates`). HasLift/HasEscalator
// are nil when unknown — never guess.
type StationGate struct {
	StationID    string   `json:"stationId"`
	Gate         Gate     `json:"gate"`
	Corner       Corner   `json:"corner"`
	Lat          *float64 `json:"lat"`
	Lng          *float64 `json:"lng"`
	LandmarkBn   *string  `json:"landmarkBn"`
	LandmarkEn   *string  `json:"landmarkEn"`
	HasLift      *bool    `json:"hasLift"`
	HasEscalator *bool    `json:"hasEscalator"`
	OpenFrom     *string  `json:"openFrom"`
	OpenTo       *string  `json:"openTo"`
	WalkMin      *float64 `json:"walkMin"`
}

type GatesFile struct {
	Source string        `json:"source"`
	Gates  []StationGate `json:"gates"`
}

// GateCandidate is an OSM entrance node near a station, awaiting a survey to
// be assigned a letter (tools/fetch-osm output).
type GateCandidate struct {
	StationID string  `json:"stationId"`
	OSMID     int64   `json:"osmId"`
	Lat       float64 `json:"lat"`
	Lng       float64 `json:"lng"`
	Ref       string  `json:"ref,omitempty"`
	Name      string  `json:"name,omitempty"`
	DistanceM float64 `json:"distanceM"`
}
