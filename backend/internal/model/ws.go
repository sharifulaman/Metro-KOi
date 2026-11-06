package model

import "encoding/json"

// Envelope is the common {"t": "..."} wrapper of every WebSocket frame.
type Envelope struct {
	T string `json:"t"`
}

// ---- client → server (spec §7.2) ----

type HelloMsg struct {
	T        string `json:"t"`
	DeviceID string `json:"deviceId"`
	V        int    `json:"v"`
	Lang     string `json:"lang"`
}

type RiderStartMsg struct {
	T         string `json:"t"`
	SessionID string `json:"sessionId"`
	Score     int    `json:"score"`
}

type RiderFixMsg struct {
	T string `json:"t"`
	Fix
}

type RiderStopMsg struct {
	T         string `json:"t"`
	SessionID string `json:"sessionId"`
}

type ReportStationMsg struct {
	T         string    `json:"t"`
	StationID string    `json:"stationId"`
	Direction Direction `json:"direction"`
	TS        int64     `json:"ts"`
}

// ---- server → client ----

type TrainsSnapshotMsg struct {
	T      string  `json:"t"`
	TS     int64   `json:"ts"`
	Trains []Train `json:"trains"`
}

type TrainUpdateMsg struct {
	T     string `json:"t"`
	Train Train  `json:"train"`
}

type TrainRemoveMsg struct {
	T  string `json:"t"`
	ID string `json:"id"`
}

type NoticeMsg struct {
	T      string `json:"t"`
	Level  string `json:"level"`
	TextBn string `json:"textBn"`
	TextEn string `json:"textEn"`
}

type RiderAckMsg struct {
	T         string `json:"t"`
	SessionID string `json:"sessionId"`
	Helping   int    `json:"helping"`
}

// MustJSON marshals a message that cannot fail to encode.
func MustJSON(v any) []byte {
	b, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return b
}
