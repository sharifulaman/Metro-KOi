package store

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/metrokoi/backend/internal/model"
)

// Postgres implements Store on PostgreSQL 16 + PostGIS (schema: migrations/).
type Postgres struct{ db *pgxpool.Pool }

func NewPostgres(ctx context.Context, url string) (*Postgres, error) {
	db, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(ctx); err != nil {
		return nil, err
	}
	return &Postgres{db: db}, nil
}

func (p *Postgres) Close()                         { p.db.Close() }
func (p *Postgres) Ping(ctx context.Context) error { return p.db.Ping(ctx) }

func (p *Postgres) Stations(ctx context.Context) ([]model.Station, error) {
	rows, err := p.db.Query(ctx, `SELECT id, order_no, name_bn, name_en, ST_Y(geom::geometry), ST_X(geom::geometry), chainage_m, status FROM stations ORDER BY order_no`)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(r pgx.CollectableRow) (model.Station, error) {
		var s model.Station
		var lat, lng, ch *float64
		err := r.Scan(&s.ID, &s.Order, &s.NameBn, &s.NameEn, &lat, &lng, &ch, &s.Status)
		s.Lat, s.Lng, s.ChainageM = lat, lng, ch
		return s, err
	})
}

func (p *Postgres) Gates(ctx context.Context, id string) ([]model.StationGate, error) {
	rows, err := p.db.Query(ctx, `SELECT station_id, gate, corner, ST_Y(geom::geometry), ST_X(geom::geometry), landmark_bn, landmark_en,
		has_lift, has_escalator, to_char(open_from,'HH24:MI'), to_char(open_to,'HH24:MI'), walk_min
		FROM station_gates WHERE station_id = $1 ORDER BY gate`, id)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(r pgx.CollectableRow) (model.StationGate, error) {
		var g model.StationGate
		err := r.Scan(&g.StationID, &g.Gate, &g.Corner, &g.Lat, &g.Lng, &g.LandmarkBn, &g.LandmarkEn, &g.HasLift, &g.HasEscalator, &g.OpenFrom, &g.OpenTo, &g.WalkMin)
		return g, err
	})
}

func (p *Postgres) Line(ctx context.Context) (*model.LineFeature, error) {
	var gj string
	var length float64
	if err := p.db.QueryRow(ctx, `SELECT ST_AsGeoJSON(geom::geometry), length_m FROM line WHERE id = 1`).Scan(&gj, &length); err != nil {
		return nil, err
	}
	f := &model.LineFeature{Type: "Feature", Properties: model.LineProperties{Name: "MRT Line 6", LengthM: length, Source: "© OpenStreetMap contributors (ODbL)"}}
	return f, json.Unmarshal([]byte(gj), &f.Geometry)
}

func (p *Postgres) Timetable(ctx context.Context) (*model.Timetable, error) {
	tt := &model.Timetable{Bands: map[model.DayType]map[model.Direction][][3]any{}}
	if err := p.db.QueryRow(ctx, `SELECT source, verified_at::text, version, holiday_as, end_to_end_min, dwell_sec FROM timetable_meta WHERE id = 1`).
		Scan(&tt.Source, &tt.VerifiedAt, &tt.Version, &tt.HolidayAs, &tt.EndToEndMin, &tt.DwellSec); err != nil {
		return nil, fmt.Errorf("timetable_meta: %w", err)
	}
	rows, err := p.db.Query(ctx, `SELECT day_type, direction, to_char(from_time,'HH24:MI'), to_char(to_time,'HH24:MI'), headway_min FROM timetable_bands ORDER BY day_type, direction, seq`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var day model.DayType
		var dir model.Direction
		var from, to string
		var h int
		if err := rows.Scan(&day, &dir, &from, &to, &h); err != nil {
			return nil, err
		}
		if tt.Bands[day] == nil {
			tt.Bands[day] = map[model.Direction][][3]any{}
		}
		tt.Bands[day][dir] = append(tt.Bands[day][dir], [3]any{from, to, float64(h)})
	}
	return tt, rows.Err()
}

func (p *Postgres) Fares(ctx context.Context) (*model.FaresFile, error) {
	f := &model.FaresFile{Source: "fares table (admin import-fares)", Currency: "BDT", RapidPassMultiplier: 0.9, Status: "TO_FETCH"}
	rows, err := p.db.Query(ctx, `SELECT from_station, to_station, amount_bdt FROM fares`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var a, b string
		var v int
		if err := rows.Scan(&a, &b, &v); err != nil {
			return nil, err
		}
		if f.Amounts == nil {
			f.Amounts = map[string]int{}
			f.Status = "official"
		}
		f.Amounts[a+"|"+b] = v
	}
	return f, rows.Err()
}

func (p *Postgres) SegmentStats(ctx context.Context) ([]model.SegmentStat, error) {
	rows, err := p.db.Query(ctx, `SELECT from_station, to_station, hour, samples, median_sec FROM segment_stats`)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByPos[model.SegmentStat])
}

func (p *Postgres) InsertRawFixes(ctx context.Context, fixes []model.RawFix) error {
	_, err := p.db.CopyFrom(ctx, pgx.Identifier{"raw_fixes"}, []string{"session_hash", "ts", "chainage_m", "speed", "acc"},
		pgx.CopyFromSlice(len(fixes), func(i int) ([]any, error) {
			f := fixes[i]
			return []any{f.SessionHash, f.TS, f.ChainageM, f.Speed, f.Acc}, nil
		}))
	return err
}

func (p *Postgres) IncSessionAgg(ctx context.Context, at time.Time) error {
	_, err := p.db.Exec(ctx, `INSERT INTO rider_sessions_agg (day, hour, sessions) VALUES ($1, $2, 1)
		ON CONFLICT (day, hour) DO UPDATE SET sessions = rider_sessions_agg.sessions + 1`, at.UTC().Format("2006-01-02"), at.UTC().Hour())
	return err
}

func (p *Postgres) PurgeRawFixes(ctx context.Context, older time.Time) (int64, error) {
	tag, err := p.db.Exec(ctx, `DELETE FROM raw_fixes WHERE ts < $1`, older)
	return tag.RowsAffected(), err
}

// Seed loads the embedded datasets into an empty (or existing) database.
func (p *Postgres) Seed(ctx context.Context) error {
	st, gates, line, tt, fares, err := Embedded()
	if err != nil {
		return err
	}
	tx, err := p.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	for _, s := range st.Stations {
		if s.Lat == nil || s.Lng == nil || s.ChainageM == nil {
			continue // planned stations without coordinates are not stored yet
		}
		if _, err := tx.Exec(ctx, `INSERT INTO stations (id, order_no, name_bn, name_en, geom, chainage_m, status)
			VALUES ($1,$2,$3,$4, ST_SetSRID(ST_MakePoint($6,$5),4326)::geography, $7, $8)
			ON CONFLICT (id) DO UPDATE SET order_no=EXCLUDED.order_no, name_bn=EXCLUDED.name_bn, name_en=EXCLUDED.name_en, geom=EXCLUDED.geom, chainage_m=EXCLUDED.chainage_m, status=EXCLUDED.status`,
			s.ID, s.Order, s.NameBn, s.NameEn, *s.Lat, *s.Lng, *s.ChainageM, s.Status); err != nil {
			return fmt.Errorf("station %s: %w", s.ID, err)
		}
	}
	gj, _ := json.Marshal(line.Geometry)
	if _, err := tx.Exec(ctx, `INSERT INTO line (id, geom, length_m) VALUES (1, ST_SetSRID(ST_GeomFromGeoJSON($1),4326)::geography, $2)
		ON CONFLICT (id) DO UPDATE SET geom=EXCLUDED.geom, length_m=EXCLUDED.length_m`, string(gj), line.Properties.LengthM); err != nil {
		return fmt.Errorf("line: %w", err)
	}
	for _, g := range gates.Gates {
		if _, err := tx.Exec(ctx, `INSERT INTO station_gates (station_id, gate, corner, geom, landmark_bn, landmark_en, has_lift, has_escalator, walk_min)
			VALUES ($1,$2,$3, CASE WHEN $4::float8 IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint($5,$4),4326)::geography END, $6,$7,$8,$9,$10)
			ON CONFLICT (station_id, gate) DO UPDATE SET corner=EXCLUDED.corner`,
			g.StationID, g.Gate, g.Corner, g.Lat, g.Lng, g.LandmarkBn, g.LandmarkEn, g.HasLift, g.HasEscalator, g.WalkMin); err != nil {
			return fmt.Errorf("gate %s/%s: %w", g.StationID, g.Gate, err)
		}
	}
	if err := writeTimetable(ctx, tx, &tt); err != nil {
		return err
	}
	if fares.Amounts != nil {
		if err := writeFares(ctx, tx, fares.Amounts); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ImportTimetable replaces the timetable (admin import-timetable).
func (p *Postgres) ImportTimetable(ctx context.Context, tt *model.Timetable) error {
	tx, err := p.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if err := writeTimetable(ctx, tx, tt); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// ImportFares replaces the fare matrix (admin import-fares).
func (p *Postgres) ImportFares(ctx context.Context, amounts map[string]int) error {
	tx, err := p.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if err := writeFares(ctx, tx, amounts); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func writeTimetable(ctx context.Context, tx pgx.Tx, tt *model.Timetable) error {
	if _, err := tx.Exec(ctx, `INSERT INTO timetable_meta (id, source, verified_at, version, holiday_as, end_to_end_min, dwell_sec)
		VALUES (1,$1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO UPDATE SET source=EXCLUDED.source, verified_at=EXCLUDED.verified_at,
		version=EXCLUDED.version, holiday_as=EXCLUDED.holiday_as, end_to_end_min=EXCLUDED.end_to_end_min, dwell_sec=EXCLUDED.dwell_sec`,
		tt.Source, tt.VerifiedAt, tt.Version, tt.HolidayAs, tt.EndToEndMin, tt.DwellSec); err != nil {
		return fmt.Errorf("timetable_meta: %w", err)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM timetable_bands`); err != nil {
		return err
	}
	for _, day := range []model.DayType{model.SunThu, model.Fri, model.Sat} {
		for _, dir := range []model.Direction{model.SB, model.NB} {
			for i, b := range tt.BandList(day, dir) {
				// seq keeps duplicate boundaries (e.g. 16:44 end + 16:44 start) distinct
				if _, err := tx.Exec(ctx, `INSERT INTO timetable_bands (day_type, direction, seq, from_time, to_time, headway_min) VALUES ($1,$2,$3,$4,$5,$6)`,
					day, dir, i, b.From, b.To, b.HeadwayMin); err != nil {
					return fmt.Errorf("band %s/%s/%d: %w", day, dir, i, err)
				}
			}
		}
	}
	return nil
}

func writeFares(ctx context.Context, tx pgx.Tx, amounts map[string]int) error {
	if _, err := tx.Exec(ctx, `DELETE FROM fares`); err != nil {
		return err
	}
	for k, v := range amounts {
		a, b, ok := strings.Cut(k, "|")
		if !ok {
			return fmt.Errorf("fare key %q: want \"from|to\"", k)
		}
		if _, err := tx.Exec(ctx, `INSERT INTO fares (from_station, to_station, amount_bdt) VALUES ($1,$2,$3)`, a, b, v); err != nil {
			return err
		}
	}
	return nil
}
