// fetch-osm builds stations.json, line6.geojson and gate_candidates.json from
// OpenStreetMap (spec §4.3, Task 3). Run once at build time and commit the
// output; then sanity-check the stations against satellite imagery.
//
//	go run ./cmd/fetch-osm -out data,../frontend/src/data
package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/metrokoi/backend/internal/geo"
	"github.com/metrokoi/backend/internal/model"
)

const (
	overpass  = "https://overpass-api.de/api/interpreter"
	bbox      = "23.70,90.34,23.89,90.43"
	userAgent = "MetroKoi-fetch-osm/1.0 (build tool; contact: maintainers)"
	maxGapM   = 60.0
)

type element struct {
	Type     string            `json:"type"`
	ID       int64             `json:"id"`
	Lat      float64           `json:"lat"`
	Lon      float64           `json:"lon"`
	Tags     map[string]string `json:"tags"`
	Members  []member          `json:"members"`
	Geometry []struct{ Lat, Lon float64 }
}

type member struct {
	Type     string  `json:"type"`
	Ref      int64   `json:"ref"`
	Role     string  `json:"role"`
	Lat      float64 `json:"lat"`
	Lon      float64 `json:"lon"`
	Geometry []struct {
		Lat float64 `json:"lat"`
		Lon float64 `json:"lon"`
	} `json:"geometry"`
}

type response struct {
	OSM3S    struct{ TimestampOSMBase string `json:"timestamp_osm_base"` } `json:"osm3s"`
	Elements []element                                                   `json:"elements"`
}

func query(q string) (*response, error) {
	req, _ := http.NewRequest(http.MethodPost, overpass, strings.NewReader("data="+url.QueryEscape(q)))
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	res, err := (&http.Client{Timeout: 150 * time.Second}).Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("overpass %d: %.200s", res.StatusCode, body)
	}
	var r response
	return &r, json.Unmarshal(body, &r)
}

func main() {
	out := flag.String("out", "data", "comma-separated output directories")
	stationsIn := flag.String("stations", "data/stations.json", "station list (ids/names/order) to enrich")
	flag.Parse()

	var file model.StationsFile
	mustRead(*stationsIn, &file)
	var open []*model.Station
	for i := range file.Stations {
		if file.Stations[i].Status == model.StationOpen {
			open = append(open, &file.Stations[i])
		}
	}

	// 1. Line 6 route relations with geometry; pick the north → south one.
	rels, err := query(fmt.Sprintf(`[out:json][timeout:90];relation["route"="subway"]["ref"="6"](%s);out geom;`, bbox))
	check(err)
	var rel *element
	for i := range rels.Elements {
		e := &rels.Elements[i]
		stops := nodesWithRole(e, "stop")
		if len(stops) >= 2 && stops[0].Lat > stops[len(stops)-1].Lat {
			rel = e
		}
	}
	if rel == nil {
		log.Fatal("no north→south Line 6 relation found")
	}
	stops := nodesWithRole(rel, "stop")
	log.Printf("relation %d: %d stops, OSM base %s", rel.ID, len(stops), rels.OSM3S.TimestampOSMBase)
	if len(stops) != len(open) {
		log.Fatalf("FAIL: relation has %d stops, expected %d open stations", len(stops), len(open))
	}

	// 2. Stop names, to verify the order-based match.
	names, err := query(fmt.Sprintf(`[out:json][timeout:60];relation(%d);node(r:"stop");out tags;`, rel.ID))
	check(err)
	nameOf := map[int64]map[string]string{}
	for _, e := range names.Elements {
		nameOf[e.ID] = e.Tags
	}

	// 3. Chain the track ways into one ordered line.
	coords := chainWays(rel, stops[0])
	line := geo.NewLine(coords)
	s0, _ := line.Snap(stops[0].Lat, stops[0].Lon)
	s1, _ := line.Snap(stops[len(stops)-1].Lat, stops[len(stops)-1].Lon)
	coords = trim(line, s0, s1)
	line = geo.NewLine(coords)
	log.Printf("line: %d vertices, %.0f m (Uttara North → Motijheel)", len(coords), line.Length())

	// 4. Match by relation order, snap for chainage, warn on name mismatch.
	mismatch := 0
	prev := -1.0
	for i, st := range open {
		m := stops[i]
		ch, off := line.Snap(m.Lat, m.Lon)
		if ch <= prev {
			log.Fatalf("FAIL: chainage not increasing at %s (%.0f ≤ %.0f)", st.ID, ch, prev)
		}
		prev = ch
		lat, lng, chain := round(m.Lat, 6), round(m.Lon, 6), round(ch, 1)
		st.Lat, st.Lng, st.ChainageM = &lat, &lng, &chain
		osmName := nameOf[m.Ref]["name:en"]
		if osmName == "" {
			osmName = nameOf[m.Ref]["name"]
		}
		ok := namesMatch(st.NameEn, osmName)
		if !ok {
			mismatch++
		}
		log.Printf("%2d %-24s %-28q chainage %7.0f m offset %4.1f m %s", st.Order, st.ID, osmName, ch, off, map[bool]string{true: "", false: "⚠ name differs"}[ok])
	}
	if mismatch > 3 {
		log.Fatalf("FAIL: %d station names differ from OSM; check the order", mismatch)
	}

	// 5. Entrance candidates within 300 m of each station (gates need a survey).
	ents, err := query(fmt.Sprintf(`[out:json][timeout:60];(node["railway"="subway_entrance"](%[1]s);node["entrance"]["subway"="yes"](%[1]s););out;`, bbox))
	check(err)
	var cands []model.GateCandidate
	for _, e := range ents.Elements {
		best, bestD := "", math.Inf(1)
		for _, st := range open {
			if d := geo.HaversineM(e.Lat, e.Lon, *st.Lat, *st.Lng); d < bestD {
				best, bestD = st.ID, d
			}
		}
		if bestD <= 300 {
			cands = append(cands, model.GateCandidate{StationID: best, OSMID: e.ID, Lat: round(e.Lat, 6), Lng: round(e.Lon, 6), Ref: e.Tags["ref"], Name: e.Tags["name"], DistanceM: round(bestD, 0)})
		}
	}
	log.Printf("entrance candidates: %d", len(cands))

	file.Geometry = "osm"
	file.Source = fmt.Sprintf("Order/names: dhakametrorail.org (spec §1.4). Coordinates + chainage: OpenStreetMap relation %d, base %s, © OpenStreetMap contributors (ODbL).", rel.ID, rels.OSM3S.TimestampOSMBase)
	feature := model.LineFeature{
		Type:       "Feature",
		Properties: model.LineProperties{Name: "MRT Line 6", LengthM: round(line.Length(), 1), Source: fmt.Sprintf("OSM relation %d, © OpenStreetMap contributors (ODbL)", rel.ID)},
		Geometry:   model.LineString{Type: "LineString", Coordinates: coords},
	}
	for _, dir := range strings.Split(*out, ",") {
		mustWrite(filepath.Join(dir, "stations.json"), file)
		mustWrite(filepath.Join(dir, "line6.geojson"), feature)
		mustWrite(filepath.Join(dir, "line6.json"), feature) // same content; bundlers import .json
		mustWrite(filepath.Join(dir, "gate_candidates.json"), map[string]any{"source": "OSM railway=subway_entrance within 300 m; assign letters after a field survey", "candidates": cands})
		log.Printf("wrote %s", dir)
	}
	log.Print("NEXT: sanity-check every station against satellite imagery (spec §4.3 step 5).")
}

func nodesWithRole(e *element, role string) []member {
	var out []member
	for _, m := range e.Members {
		if m.Type == "node" && m.Role == role {
			out = append(out, m)
		}
	}
	return out
}

// chainWays orders the relation's track ways end-to-end, starting at the end
// nearest the first stop, reversing ways as needed.
func chainWays(rel *element, first member) [][2]float64 {
	var ways [][][2]float64
	for _, m := range rel.Members {
		if m.Type == "way" && (m.Role == "" || m.Role == "forward" || m.Role == "backward") && len(m.Geometry) > 1 {
			var w [][2]float64
			for _, g := range m.Geometry {
				w = append(w, [2]float64{g.Lon, g.Lat})
			}
			ways = append(ways, w)
		}
	}
	if len(ways) == 0 {
		log.Fatal("relation has no track ways")
	}
	dist := func(p [2]float64, lat, lng float64) float64 { return geo.HaversineM(p[1], p[0], lat, lng) }
	// start: way endpoint closest to the first stop
	bi, rev, bd := 0, false, math.Inf(1)
	for i, w := range ways {
		if d := dist(w[0], first.Lat, first.Lon); d < bd {
			bi, rev, bd = i, false, d
		}
		if d := dist(w[len(w)-1], first.Lat, first.Lon); d < bd {
			bi, rev, bd = i, true, d
		}
	}
	used := make([]bool, len(ways))
	line := orient(ways[bi], rev)
	used[bi] = true
	for n := 1; n < len(ways); n++ {
		end := line[len(line)-1]
		bi, rev, bd = -1, false, math.Inf(1)
		for i, w := range ways {
			if used[i] {
				continue
			}
			if d := dist(w[0], end[1], end[0]); d < bd {
				bi, rev, bd = i, false, d
			}
			if d := dist(w[len(w)-1], end[1], end[0]); d < bd {
				bi, rev, bd = i, true, d
			}
		}
		if bd > maxGapM {
			log.Fatalf("FAIL: gap of %.0f m between track ways", bd)
		}
		next := orient(ways[bi], rev)
		if bd < 1 {
			next = next[1:]
		}
		line = append(line, next...)
		used[bi] = true
	}
	return line
}

func orient(w [][2]float64, reverse bool) [][2]float64 {
	out := append([][2]float64(nil), w...)
	if reverse {
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
		}
	}
	return out
}

// trim keeps the part of the line between chainages a and b (a < b).
func trim(l *geo.Line, a, b float64) [][2]float64 {
	lat, lng, _ := l.PointAt(a)
	out := [][2]float64{{round(lng, 7), round(lat, 7)}}
	for i, c := range l.Cum {
		if c > a && c < b {
			out = append(out, [2]float64{round(l.LatLng[i][1], 7), round(l.LatLng[i][0], 7)})
		}
	}
	lat, lng, _ = l.PointAt(b)
	return append(out, [2]float64{round(lng, 7), round(lat, 7)})
}

func namesMatch(ours, osm string) bool {
	norm := func(s string) string {
		s = strings.ToLower(s)
		var b strings.Builder
		for _, r := range s {
			if r >= 'a' && r <= 'z' || r >= '0' && r <= '9' {
				b.WriteRune(r)
			}
		}
		return b.String()
	}
	o, n := norm(ours), norm(osm)
	if o == "" || n == "" {
		return false
	}
	key := norm(strings.FieldsFunc(ours, func(r rune) bool { return r == ' ' || r == '-' })[0])
	return strings.Contains(n, o) || strings.Contains(n, key[:min(len(key), 5)])
}

func round(v float64, d int) float64 {
	p := math.Pow(10, float64(d))
	return math.Round(v*p) / p
}

func mustRead(path string, v any) {
	b, err := os.ReadFile(path)
	check(err)
	check(json.Unmarshal(b, v))
}

func mustWrite(path string, v any) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", " ")
	check(enc.Encode(v))
	check(os.WriteFile(path, buf.Bytes(), 0o644))
}

func check(err error) {
	if err != nil {
		log.Fatal(err)
	}
}
