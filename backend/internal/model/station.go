// Package model holds every domain type shared by the API, the fusion engine,
// the schedule engine and storage. JSON tags match the mobile app (spec §7).
package model

// StationStatus: planned stations (e.g. Kamalapur) are stored but hidden from users.
type StationStatus string

const (
	StationOpen    StationStatus = "open"
	StationPlanned StationStatus = "planned"
)

// Station is one Line-6 station (spec §1.4, §4.3, table `stations`).
// Lat/Lng/ChainageM are nil until tools/fetch-osm has been run.
type Station struct {
	ID        string        `json:"id"`
	Order     int           `json:"order"`
	NameBn    string        `json:"nameBn"`
	NameEn    string        `json:"nameEn"`
	Lat       *float64      `json:"lat"`
	Lng       *float64      `json:"lng"`
	ChainageM *float64      `json:"chainageM"`
	Status    StationStatus `json:"status"`
}

// StationsFile is the shape of data/stations.json.
type StationsFile struct {
	Source   string    `json:"source"`
	Geometry string    `json:"geometry"` // "osm" | "TO_FETCH"
	Stations []Station `json:"stations"`
}

// Platform 1 → towards Motijheel (SB); platform 2 → towards Uttara North (NB).
type Platform int

const (
	Platform1 Platform = 1
	Platform2 Platform = 2
)

// PlatformFor returns the platform a direction departs from.
func PlatformFor(d Direction) Platform {
	if d == SB {
		return Platform1
	}
	return Platform2
}

// LineFeature is data/line6.geojson (a GeoJSON Feature with a LineString).
type LineFeature struct {
	Type       string         `json:"type"`
	Properties LineProperties `json:"properties"`
	Geometry   LineString     `json:"geometry"`
}

type LineProperties struct {
	Name    string  `json:"name"`
	LengthM float64 `json:"lengthM"`
	Source  string  `json:"source,omitempty"`
}

type LineString struct {
	Type        string       `json:"type"`
	Coordinates [][2]float64 `json:"coordinates"` // [lng, lat]
}
