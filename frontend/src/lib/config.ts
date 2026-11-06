// Runtime configuration. Set EXPO_PUBLIC_API_URL to the backend, e.g.
// http://192.168.0.10:8080 when testing on a phone on the same Wi-Fi.
const API = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export const config = {
  apiBase: `${API}/v1`,
  wsUrl: `${API.replace(/^http/, 'ws')}/v1/ws`,
  /** Default station for "Next trains near you" until location is known. */
  defaultStationId: 'farmgate',
};
