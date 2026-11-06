package model

import "time"

// Fix is a rider GPS fix as received (spec §7.2 rider.fix).
type Fix struct {
	SessionID string  `json:"sessionId"`
	Lat       float64 `json:"lat"`
	Lng       float64 `json:"lng"`
	Acc       float64 `json:"acc"` // metres
	Spd       float64 `json:"spd"` // m/s
	Hdg       float64 `json:"hdg"`
	TS        int64   `json:"ts"` // ms epoch
}

// SnappedFix is a fix after projection onto the line (spec §6.1).
type SnappedFix struct {
	Fix
	ChainageM      float64
	LateralOffsetM float64
	Received       time.Time
}

// RejectReason labels why a fix was dropped (metrics, spec §13).
type RejectReason string

const (
	RejectAccuracy RejectReason = "accuracy"
	RejectOffset   RejectReason = "offset"
	RejectStale    RejectReason = "stale"
	RejectSpeed    RejectReason = "speed"
	RejectRate     RejectReason = "rate"
	RejectSession  RejectReason = "session"
	RejectOutlier  RejectReason = "outlier"
)

// RiderSession is the server's in-memory view of a sharing session.
type RiderSession struct {
	SessionID string
	DeviceID  string
	Score     int
	StartedAt time.Time
	LastFixAt time.Time
	TrackID   string
	Direction Direction // "" until known
	History   []SnappedFix
}

// RawFix is table `raw_fixes` (purged after 24 h; no lat/lng stored).
type RawFix struct {
	SessionHash string    `json:"sessionHash"`
	TS          time.Time `json:"ts"`
	ChainageM   float64   `json:"chainageM"`
	Speed       float64   `json:"speed"`
	Acc         float64   `json:"acc"`
}

// RiderSessionsAgg is table `rider_sessions_agg`.
type RiderSessionsAgg struct {
	Day      string `json:"day"`
	Hour     int    `json:"hour"`
	Sessions int    `json:"sessions"`
}
