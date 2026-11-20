// Runtime configuration (EXPO_PUBLIC_* variables from .env.local).
export const config = {
  /** Supabase project URL + anon key (Project Settings -> API). Without them the app runs offline on the bundled timetable. */
  supabaseUrl: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, ''),
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  /** Google Maps JavaScript API key for the Live map (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local). */
  googleMapsKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  /** Optional Google Map ID (vector map: tilt, rotation, 3D buildings). Falls back to Google's DEMO_MAP_ID. */
  googleMapId: process.env.EXPO_PUBLIC_GOOGLE_MAP_ID ?? 'DEMO_MAP_ID',
  /** Default station for "Next trains near you" until location is known. */
  defaultStationId: 'farmgate',
};
