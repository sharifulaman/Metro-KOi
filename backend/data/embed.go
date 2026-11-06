// Package data embeds the static datasets so the API runs without a database
// (memory store) and so `admin seed` can load Postgres. Regenerate stations
// and the line with `go run ./cmd/fetch-osm`.
package data

import _ "embed"

//go:embed stations.json
var Stations []byte

//go:embed timetable.json
var Timetable []byte

//go:embed gates.json
var Gates []byte

//go:embed fares.json
var Fares []byte

//go:embed line6.geojson
var Line []byte

//go:embed gate_candidates.json
var GateCandidates []byte
