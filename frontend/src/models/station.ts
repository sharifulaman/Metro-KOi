/** Station status: `planned` stations (e.g. Kamalapur) are hidden from users. */
export type StationStatus = 'open' | 'planned';

/**
 * A Line-6 station (spec §1.4, §4.3, §7.3 `stations`).
 * `lat`, `lng` and `chainageM` are TO FETCH from OpenStreetMap — null until
 * `tools/fetch-osm` has been run. Never fill them in by hand.
 */
export interface Station {
  id: string;
  order: number;
  nameBn: string;
  nameEn: string;
  lat: number | null;
  lng: number | null;
  /** Metres from Uttara North along the line. */
  chainageM: number | null;
  status: StationStatus;
}

export interface StationsFile {
  source: string;
  geometry: 'osm' | 'TO_FETCH';
  stations: Station[];
}

/** Platform 1 → towards Motijheel (SB), platform 2 → towards Uttara North (NB). */
export type Platform = 1 | 2;

/** GeoJSON LineString for the track (spec §4.3, `line6.geojson`). */
export interface LineGeometry {
  type: 'Feature';
  properties: { name: string; lengthM: number };
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}
