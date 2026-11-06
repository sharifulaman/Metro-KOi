// Package store loads static data and persists privacy-safe aggregates.
// Postgres+PostGIS in production; an in-memory store (embedded JSON) when
// DATABASE_URL is empty, so the API runs with no infrastructure.
package store

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/metrokoi/backend/data"
	"github.com/metrokoi/backend/internal/model"
)

type Store interface {
	Stations(ctx context.Context) ([]model.Station, error)
	Gates(ctx context.Context, stationID string) ([]model.StationGate, error)
	Line(ctx context.Context) (*model.LineFeature, error)
	Timetable(ctx context.Context) (*model.Timetable, error)
	Fares(ctx context.Context) (*model.FaresFile, error)
	SegmentStats(ctx context.Context) ([]model.SegmentStat, error)
	InsertRawFixes(ctx context.Context, fixes []model.RawFix) error
	IncSessionAgg(ctx context.Context, at time.Time) error
	PurgeRawFixes(ctx context.Context, olderThan time.Time) (int64, error)
	Ping(ctx context.Context) error
	Close()
}

// Embedded returns the datasets compiled into the binary.
func Embedded() (st model.StationsFile, gates model.GatesFile, line model.LineFeature, tt model.Timetable, fares model.FaresFile, err error) {
	for _, x := range []struct {
		b []byte
		v any
		n string
	}{{data.Stations, &st, "stations"}, {data.Gates, &gates, "gates"}, {data.Line, &line, "line"}, {data.Timetable, &tt, "timetable"}, {data.Fares, &fares, "fares"}} {
		if err = json.Unmarshal(x.b, x.v); err != nil {
			err = fmt.Errorf("embedded %s: %w", x.n, err)
			return
		}
	}
	return
}

// Memory is the no-infrastructure store. Raw fixes are kept only in memory
// and purged like the Postgres table.
type Memory struct {
	stations model.StationsFile
	gates    model.GatesFile
	line     model.LineFeature
	tt       model.Timetable
	fares    model.FaresFile

	mu   sync.Mutex
	raw  []model.RawFix
	aggs map[string]int
}

func NewMemory(endToEndMin, dwellSec float64, holidayAs model.DayType) (*Memory, error) {
	st, g, l, tt, f, err := Embedded()
	if err != nil {
		return nil, err
	}
	tt.EndToEndMin, tt.DwellSec, tt.HolidayAs = endToEndMin, dwellSec, holidayAs
	return &Memory{stations: st, gates: g, line: l, tt: tt, fares: f, aggs: map[string]int{}}, nil
}

func (m *Memory) Stations(context.Context) ([]model.Station, error) { return m.stations.Stations, nil }

func (m *Memory) Gates(_ context.Context, id string) ([]model.StationGate, error) {
	out := []model.StationGate{}
	for _, g := range m.gates.Gates {
		if g.StationID == id {
			out = append(out, g)
		}
	}
	return out, nil
}

func (m *Memory) Line(context.Context) (*model.LineFeature, error)     { return &m.line, nil }
func (m *Memory) Timetable(context.Context) (*model.Timetable, error)   { return &m.tt, nil }
func (m *Memory) Fares(context.Context) (*model.FaresFile, error)       { return &m.fares, nil }
func (m *Memory) SegmentStats(context.Context) ([]model.SegmentStat, error) { return nil, nil }
func (m *Memory) Ping(context.Context) error                            { return nil }
func (m *Memory) Close()                                                {}

func (m *Memory) InsertRawFixes(_ context.Context, f []model.RawFix) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.raw = append(m.raw, f...)
	return nil
}

func (m *Memory) IncSessionAgg(_ context.Context, at time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.aggs[at.UTC().Format("2006-01-02T15")]++
	return nil
}

func (m *Memory) PurgeRawFixes(_ context.Context, older time.Time) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	kept := m.raw[:0]
	for _, f := range m.raw {
		if f.TS.After(older) {
			kept = append(kept, f)
		}
	}
	n := int64(len(m.raw) - len(kept))
	m.raw = kept
	return n, nil
}
