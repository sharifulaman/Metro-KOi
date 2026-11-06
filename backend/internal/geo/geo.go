// Package geo: WGS84 → UTM 46N projection and polyline snapping (spec §6.1, §13).
package geo

import "math"

const (
	a      = 6378137.0
	f      = 1 / 298.257223563
	k0     = 0.9996
	zone46 = 93.0 // central meridian of UTM zone 46 (EPSG:32646)
)

// XY is a projected point in metres.
type XY struct{ X, Y float64 }

// ToUTM46 projects lat/lng (degrees) to UTM zone 46N (EPSG:32646).
func ToUTM46(lat, lng float64) XY {
	e2 := f * (2 - f)
	ep2 := e2 / (1 - e2)
	phi := lat * math.Pi / 180
	lam := (lng - zone46) * math.Pi / 180
	sin, cos, tan := math.Sin(phi), math.Cos(phi), math.Tan(phi)
	n := a / math.Sqrt(1-e2*sin*sin)
	t := tan * tan
	c := ep2 * cos * cos
	A := cos * lam
	e4, e6 := e2*e2, e2*e2*e2
	m := a * ((1-e2/4-3*e4/64-5*e6/256)*phi -
		(3*e2/8+3*e4/32+45*e6/1024)*math.Sin(2*phi) +
		(15*e4/256+45*e6/1024)*math.Sin(4*phi) -
		(35*e6/3072)*math.Sin(6*phi))
	x := k0*n*(A+(1-t+c)*math.Pow(A, 3)/6+(5-18*t+t*t+72*c-58*ep2)*math.Pow(A, 5)/120) + 500000
	y := k0 * (m + n*tan*(A*A/2+(5-t+9*c+4*c*c)*math.Pow(A, 4)/24+(61-58*t+t*t+600*c-330*ep2)*math.Pow(A, 6)/720))
	return XY{x, y}
}

// HaversineM is the great-circle distance in metres.
func HaversineM(lat1, lng1, lat2, lng2 float64) float64 {
	const r = 6371008.8
	rad := math.Pi / 180
	dLat := (lat2 - lat1) * rad
	dLng := (lng2 - lng1) * rad
	h := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Cos(lat1*rad)*math.Cos(lat2*rad)*math.Sin(dLng/2)*math.Sin(dLng/2)
	return 2 * r * math.Asin(math.Sqrt(h))
}

// Line is the track polyline with projected vertices and cumulative chainage.
type Line struct {
	LatLng [][2]float64 // [lat, lng]
	XY     []XY
	Cum    []float64 // chainage at each vertex, metres from vertex 0
}

// NewLine builds a Line from [lng, lat] GeoJSON coordinates.
func NewLine(coords [][2]float64) *Line {
	l := &Line{}
	for i, c := range coords {
		l.LatLng = append(l.LatLng, [2]float64{c[1], c[0]})
		p := ToUTM46(c[1], c[0])
		l.XY = append(l.XY, p)
		if i == 0 {
			l.Cum = append(l.Cum, 0)
		} else {
			q := l.XY[i-1]
			l.Cum = append(l.Cum, l.Cum[i-1]+math.Hypot(p.X-q.X, p.Y-q.Y))
		}
	}
	return l
}

// Length of the line in metres.
func (l *Line) Length() float64 {
	if len(l.Cum) == 0 {
		return 0
	}
	return l.Cum[len(l.Cum)-1]
}

// Snap returns the chainage of the nearest point on the line and the lateral
// offset in metres. A linear scan is fine for a ~250-vertex line (spec §13).
func (l *Line) Snap(lat, lng float64) (chainage, offset float64) {
	p := ToUTM46(lat, lng)
	best := math.Inf(1)
	for i := 1; i < len(l.XY); i++ {
		a, b := l.XY[i-1], l.XY[i]
		dx, dy := b.X-a.X, b.Y-a.Y
		seg := dx*dx + dy*dy
		t := 0.0
		if seg > 0 {
			t = math.Max(0, math.Min(1, ((p.X-a.X)*dx+(p.Y-a.Y)*dy)/seg))
		}
		cx, cy := a.X+t*dx, a.Y+t*dy
		d := math.Hypot(p.X-cx, p.Y-cy)
		if d < best {
			best = d
			chainage = l.Cum[i-1] + t*math.Sqrt(seg)
		}
	}
	return chainage, best
}

// PointAt returns lat, lng and bearing (degrees from north) at chainage s.
func (l *Line) PointAt(s float64) (lat, lng, bearing float64) {
	n := len(l.Cum)
	if n == 0 {
		return 0, 0, 0
	}
	s = math.Max(0, math.Min(l.Length(), s))
	i := 1
	for i < n-1 && l.Cum[i] < s {
		i++
	}
	seg := l.Cum[i] - l.Cum[i-1]
	t := 0.0
	if seg > 0 {
		t = (s - l.Cum[i-1]) / seg
	}
	a, b := l.LatLng[i-1], l.LatLng[i]
	lat = a[0] + t*(b[0]-a[0])
	lng = a[1] + t*(b[1]-a[1])
	// True-north bearing (UTM grid north differs by ~1° in Dhaka).
	bearing = BearingDeg(a[0], a[1], b[0], b[1])
	return
}

// BearingDeg is the initial great-circle bearing from point 1 to point 2.
func BearingDeg(lat1, lng1, lat2, lng2 float64) float64 {
	rad := math.Pi / 180
	y := math.Sin((lng2-lng1)*rad) * math.Cos(lat2*rad)
	x := math.Cos(lat1*rad)*math.Sin(lat2*rad) - math.Sin(lat1*rad)*math.Cos(lat2*rad)*math.Cos((lng2-lng1)*rad)
	return math.Mod(math.Atan2(y, x)/rad+360, 360)
}
