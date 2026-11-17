import { GoogleMapView, ZOOM_NEAR, type MapGate } from '@/components/map';
import { fractionOf, useTrains } from '@/features/map/useTrains';
import { useUserLocation } from '@/features/map/useUserLocation';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';

/** The real map around one station: the line, every station, the trains, and the rider's own dot. 2D, or tilted 3D with buildings. */
export function StationMap({ stationId, height, tilt, zoom = ZOOM_NEAR, gates, selectedGate, onGatePress }: { stationId: string; height?: number; tilt?: boolean; zoom?: number; gates?: MapGate[]; selectedGate?: string; onGatePress?(id: string): void }) {
  const { t, lang } = useT();
  const { list, byId } = useStations();
  const { trains, model } = useTrains(1000);
  const { user } = useUserLocation();
  const idx = model.stationIds.indexOf(stationId);
  return (
    <GoogleMapView
      height={height}
      zoom={zoom}
      focus={idx >= 0 ? fractionOf(model, model.chainage[idx]) : 0.5}
      stations={list.map((s, i) => ({ id: s.id, label: stationName(byId[s.id] ?? s, lang), f: fractionOf(model, model.chainage[i]) }))}
      trains={trains.map((tr) => ({ id: tr.id, dir: tr.dir, state: tr.state, f: fractionOf(model, tr.s), label: tr.dwellLeftSec != null ? t('live.atStationTag', { id: tr.id }) : undefined }))}
      selectedStation={stationId}
      user={user}
      tilt={tilt}
      gates={gates}
      selectedGate={selectedGate}
      onGatePress={onGatePress}
      errorText={t('live.mapError')}
    />
  );
}
