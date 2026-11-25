import { GoogleMapView, ZOOM_NEAR, type MapGate } from '@/components/map';
import { fractionOf, useTrains } from '@/features/map/useTrains';
import { useHeading } from '@/features/gates/useHeading';
import { useScreenLocation } from '@/features/map/useUserLocation';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { useRider } from '@/store/rider';

/** The real map around one station: the line, every station, the trains, and the rider's own dot. 2D, or tilted 3D with buildings. */
export function StationMap({ stationId, height, tilt, zoom = ZOOM_NEAR, gates, selectedGate, onGatePress, platformSigns, walkTo, headingUp, onCompass }: { stationId: string; height?: number; tilt?: boolean; zoom?: number; gates?: MapGate[]; selectedGate?: string; onGatePress?(id: string): void; platformSigns?: Record<'SB' | 'NB', string>; walkTo?: { lat: number; lng: number } | null; headingUp?: boolean; onCompass?(): void }) {
  const { t, lang } = useT();
  const { list, byId } = useStations();
  const { trains, model } = useTrains(1000);
  const { user } = useScreenLocation();
  const riding = useRider((s) => !!s.session);
  // the compass is read only where the map offers heading-up (the gate finder)
  const compass = useHeading(!!onCompass && !riding && !!user);
  // walking slowly the compass shows where the phone faces; on the move (> 2 m/s) the GPS course is truer
  const heading = user && (user.speed ?? 0) > 2 && user.course != null ? user.course : compass;
  const me = riding || !user ? undefined : { ...user, heading };
  const idx = model.stationIds.indexOf(stationId);
  return (
    <GoogleMapView
      height={height}
      zoom={zoom}
      focus={idx >= 0 ? fractionOf(model, model.chainage[idx]) : 0.5}
      stations={list.map((s, i) => ({ id: s.id, label: stationName(byId[s.id] ?? s, lang), f: fractionOf(model, model.chainage[i]) }))}
      trains={trains.map((tr) => ({
        id: tr.id,
        dir: tr.dir,
        state: tr.state,
        f: fractionOf(model, tr.s),
        label: tr.dwellLeftSec != null ? t('live.atStationTag', { id: tr.id }) : undefined,
      }))}
      selectedStation={stationId}
      platformSigns={platformSigns}
      user={me}
      walkTo={me ? walkTo : null}
      fitPoints={me && walkTo && !headingUp ? [me, walkTo] : null}
      fitKey={walkTo ? `${walkTo.lat},${walkTo.lng}` : undefined}
      headingUp={!!headingUp && heading != null && !tilt}
      compass={onCompass && !tilt ? { headingUp: !!headingUp, onPress: onCompass, label: t(headingUp ? 'map.northUp' : 'map.headingUp') } : undefined}
      tilt={tilt}
      gates={gates}
      selectedGate={selectedGate}
      onGatePress={onGatePress}
      errorText={t('live.mapError')}
    />
  );
}
