package geo

import (
	"math"
	"testing"
)

func TestUTM46KnownPoint(t *testing.T) {
	// Central meridian at the equator maps to false easting 500 000 m.
	p := ToUTM46(0, 93)
	if math.Abs(p.X-500000) > 0.01 || math.Abs(p.Y) > 0.01 {
		t.Fatalf("got %+v", p)
	}
	// Dhaka (23.81 N, 90.41 E): easting ~236 km, northing ~2 635 km.
	d := ToUTM46(23.81, 90.41)
	if d.X < 230000 || d.X > 242000 || d.Y < 2630000 || d.Y > 2640000 {
		t.Fatalf("Dhaka projected to %+v", d)
	}
}

func TestProjectionMatchesHaversine(t *testing.T) {
	a := ToUTM46(23.80, 90.36)
	b := ToUTM46(23.81, 90.37)
	planar := math.Hypot(a.X-b.X, a.Y-b.Y)
	hv := HaversineM(23.80, 90.36, 23.81, 90.37)
	if math.Abs(planar-hv)/hv > 0.002 { // k0 scale + latitude: < 0.2 %
		t.Fatalf("planar %.1f vs haversine %.1f", planar, hv)
	}
}

func TestSnapAndPointAt(t *testing.T) {
	// A ~1.1 km straight north–south line.
	l := NewLine([][2]float64{{90.37, 23.80}, {90.37, 23.81}})
	if math.Abs(l.Length()-1107) > 10 {
		t.Fatalf("length %.1f", l.Length())
	}
	s, off := l.Snap(23.805, 90.3702) // ~20 m east of the midpoint
	if math.Abs(s-l.Length()/2) > 5 || off < 15 || off > 25 {
		t.Fatalf("snap s=%.1f off=%.1f", s, off)
	}
	lat, lng, brg := l.PointAt(l.Length() / 2)
	if math.Abs(lat-23.805) > 1e-4 || math.Abs(lng-90.37) > 1e-6 || math.Abs(brg) > 1 && math.Abs(brg-360) > 1 {
		t.Fatalf("pointAt %.5f %.5f %.1f", lat, lng, brg)
	}
}
