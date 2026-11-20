import { kvStore } from './storage';

/**
 * Offline map tiles: the 3D map's real-map data (OpenStreetMap buildings, streets, place names) is saved here
 * once it has been fetched, so any area the rider has already looked at still draws with no connection.
 * The 3D page asks for a tile by key and hands over a tile after fetching it (messages in GoogleMapView).
 * Only the newest MAX_TILES are kept (about 40 MB at most), the oldest are dropped.
 */
const kv = kvStore('metro-koi-tiles');
const MAX_TILES = 40;
const INDEX = 'index';

interface Entry {
  k: string;
  at: number;
}

function readIndex(): Entry[] {
  try {
    return JSON.parse(kv.getString(INDEX) ?? '[]') as Entry[];
  } catch {
    return [];
  }
}

/** A saved tile as the JSON text the 3D page stored, or null. */
export function getTile(key: string): string | null {
  return kv.getString('t:' + key) ?? null;
}

export function putTile(key: string, data: string): void {
  try {
    kv.set('t:' + key, data);
    const idx = readIndex().filter((e) => e.k !== key);
    idx.push({ k: key, at: Date.now() });
    // newest last: drop the oldest beyond the limit
    while (idx.length > MAX_TILES) {
      const old = idx.shift();
      if (old) kv.remove('t:' + old.k);
    }
    kv.set(INDEX, JSON.stringify(idx));
  } catch {
    // storage full or unavailable: the map still works, it just is not saved
  }
}
