-- Schema from spec §7.3 and §18.2. Apply with golang-migrate (docker compose runs it).
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE stations (
  id TEXT PRIMARY KEY,
  order_no INT NOT NULL,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  geom geography(Point, 4326) NOT NULL,
  chainage_m REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'planned'))
);

CREATE TABLE line (
  id INT PRIMARY KEY,
  geom geography(LineString, 4326) NOT NULL,
  length_m REAL NOT NULL
);

-- Timetable header (source, version for ETag, UNVERIFIED defaults).
CREATE TABLE timetable_meta (
  id INT PRIMARY KEY CHECK (id = 1),
  source TEXT NOT NULL,
  verified_at DATE NOT NULL,
  version TEXT NOT NULL,
  holiday_as TEXT NOT NULL DEFAULT 'fri',
  end_to_end_min REAL NOT NULL DEFAULT 40,
  dwell_sec REAL NOT NULL DEFAULT 30
);

-- `seq` is added to the spec's primary key: published bands share boundary
-- minutes (16:44, 20:39), so (day_type, direction, from_time) alone is not unique.
CREATE TABLE timetable_bands (
  day_type TEXT NOT NULL CHECK (day_type IN ('sun_thu', 'fri', 'sat')),
  direction TEXT NOT NULL CHECK (direction IN ('SB', 'NB')),
  seq INT NOT NULL,
  from_time TIME NOT NULL,
  to_time TIME NOT NULL,
  headway_min INT NOT NULL CHECK (headway_min > 0),
  PRIMARY KEY (day_type, direction, seq)
);

CREATE TABLE segment_stats (
  from_station TEXT,
  to_station TEXT,
  hour INT,
  samples INT,
  median_sec REAL,
  PRIMARY KEY (from_station, to_station, hour)
);

CREATE TABLE fares (
  from_station TEXT,
  to_station TEXT,
  amount_bdt INT,
  PRIMARY KEY (from_station, to_station)
);

-- Aggregated only; no raw points kept > 24 h.
CREATE TABLE rider_sessions_agg (
  day DATE,
  hour INT,
  sessions INT,
  PRIMARY KEY (day, hour)
);

-- Purged hourly where ts < now() - 24 h. No lat/lng is ever stored.
CREATE TABLE raw_fixes (
  session_hash TEXT,
  ts TIMESTAMPTZ,
  chainage_m REAL,
  speed REAL,
  acc REAL
);
CREATE INDEX raw_fixes_ts ON raw_fixes (ts);

CREATE TABLE station_gates (
  station_id TEXT REFERENCES stations(id),
  gate CHAR(1) CHECK (gate IN ('A', 'B', 'C', 'D')),
  geom geography(Point, 4326),          -- NULL until surveyed
  corner TEXT CHECK (corner IN ('NW', 'NE', 'SW', 'SE')),
  landmark_bn TEXT,
  landmark_en TEXT,
  has_lift BOOLEAN,                     -- NULL = unknown (never guess)
  has_escalator BOOLEAN,
  open_from TIME,
  open_to TIME,
  walk_min REAL,
  PRIMARY KEY (station_id, gate)
);
