import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';

import { ScreenHeader } from '@/components/metro';
import { Button, Card, ListRow, Screen, SectionLabel, Segmented, Stack, Text } from '@/components/ui';
import { stationName, useStations } from '@/features/stations/useStations';
import { useRunModel } from '@/features/timetable/useTimetable';
import line from '@/data/line6.json';
import { useT } from '@/i18n';
import { snapToLine } from '@/lib/lineGeo';
import { initialRide, stepRide, type RidePhase, type RideState } from '@/lib/rideDetector';
import { GATES, type Gate } from '@/models';

const LINE_M = line.properties.lengthM;
/** seconds of fixes averaged for one gate */
const SURVEY_SEC = 30;

interface GatePoint {
  stationId: string;
  gate: Gate;
  lat: number;
  lng: number;
  accuracyM: number;
  surveyedAt: string;
  approx: false;
}

interface RideRow {
  ts: number;
  lat: number;
  lng: number;
  acc: number | null;
  spd: number | null;
  s: number;
  offsetM: number;
  phase: RidePhase;
}

/**
 * Field tools (dev builds; docs/train-tracking-plan.md §5.9 step 5 and §6.1):
 * - gate survey: stand at a gate's stair foot, record 30 s, the averaged point goes into gates.json;
 * - ride recorder: record a real metro ride (or a bus ride, for contrast) with what the detector decided at each fix,
 *   to tune its thresholds. Both export JSON through the share sheet.
 */
export default function FieldToolsScreen() {
  const router = useRouter();
  const { lang } = useT();
  const { list } = useStations();
  const model = useRunModel();
  const [tool, setTool] = useState<'gates' | 'ride'>('gates');

  // ---- gate survey
  const [stationId, setStationId] = useState(list[0]?.id ?? '');
  const [gate, setGate] = useState<Gate>('A');
  const [points, setPoints] = useState<GatePoint[]>([]);
  const [surveyLeft, setSurveyLeft] = useState<number | null>(null);

  const survey = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return;
    const fixes: Location.LocationObject[] = [];
    setSurveyLeft(SURVEY_SEC);
    const sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 }, (l) => fixes.push(l));
    for (let k = SURVEY_SEC; k > 0; k--) {
      await new Promise((r) => setTimeout(r, 1000));
      setSurveyLeft(k - 1);
    }
    sub.remove();
    setSurveyLeft(null);
    // keep the better half of the fixes, weighted by 1/accuracy²
    const good = fixes.filter((f) => f.coords.accuracy != null).sort((a, b) => (a.coords.accuracy ?? 99) - (b.coords.accuracy ?? 99)).slice(0, Math.max(1, Math.ceil(fixes.length / 2)));
    if (!good.length) return;
    const w = good.map((f) => 1 / Math.max(1, f.coords.accuracy ?? 99) ** 2);
    const sw = w.reduce((a, b) => a + b, 0);
    const lat = good.reduce((a, f, i) => a + f.coords.latitude * w[i], 0) / sw;
    const lng = good.reduce((a, f, i) => a + f.coords.longitude * w[i], 0) / sw;
    const acc = Math.round(Math.min(...good.map((f) => f.coords.accuracy ?? 99)));
    const p: GatePoint = { stationId, gate, lat: +lat.toFixed(7), lng: +lng.toFixed(7), accuracyM: acc, surveyedAt: new Date().toISOString().slice(0, 10), approx: false };
    setPoints((cur) => [...cur.filter((x) => !(x.stationId === p.stationId && x.gate === p.gate)), p]);
  };

  // ---- ride recorder
  const [recording, setRecording] = useState(false);
  const [rows, setRows] = useState<RideRow[]>([]);
  const [phase, setPhase] = useState<RidePhase>('IDLE');
  const sub = useRef<Location.LocationSubscription | null>(null);
  const detector = useRef<RideState>(initialRide(Date.now()));
  useEffect(() => () => sub.current?.remove(), []);

  const toggleRecord = async () => {
    if (recording) {
      sub.current?.remove();
      sub.current = null;
      setRecording(false);
      return;
    }
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return;
    detector.current = initialRide(Date.now());
    setRows([]);
    setRecording(true);
    sub.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 0 }, (l) => {
      const snap = snapToLine(l.coords.latitude, l.coords.longitude);
      const s = model.chainage[0] + snap.f * LINE_M;
      detector.current = stepRide(detector.current, { ts: l.timestamp, s, offsetM: snap.metres, speed: Math.max(0, l.coords.speed ?? 0) }, { stationM: model.chainage });
      setPhase(detector.current.phase);
      setRows((cur) => [...cur, { ts: l.timestamp, lat: l.coords.latitude, lng: l.coords.longitude, acc: l.coords.accuracy, spd: l.coords.speed, s: Math.round(s), offsetM: Math.round(snap.metres), phase: detector.current.phase }]);
    });
  };

  const exportJson = (name: string, data: unknown) => void Share.share({ title: name, message: JSON.stringify(data, null, 1) });

  return (
    <Screen scroll gap={4}>
      <ScreenHeader title="Field tools" onBack={() => router.back()} />
      <Segmented<'gates' | 'ride'> value={tool} onChange={setTool} options={[{ value: 'gates', label: 'Gate survey' }, { value: 'ride', label: 'Ride recorder' }]} />

      {tool === 'gates' ? (
        <Stack gap={3}>
          <Text tone="muted">Stand at the foot of the gate's stairs, under open sky if you can, and record {SURVEY_SEC} s.</Text>
          <SectionLabel text="Station" />
          <Card padding={2}>
            {list.map((s, i) => (
              <ListRow key={s.id} title={stationName(s, lang)} highlighted={s.id === stationId} divider={i < list.length - 1} onPress={() => setStationId(s.id)} />
            ))}
          </Card>
          <SectionLabel text="Gate" />
          <Segmented<Gate> value={gate} onChange={setGate} options={GATES.map((g) => ({ value: g, label: g }))} />
          <Button label={surveyLeft != null ? `Recording… ${surveyLeft} s` : `Record ${stationId} gate ${gate}`} fullWidth disabled={surveyLeft != null} onPress={() => void survey()} />
          {points.map((p) => (
            <Text key={`${p.stationId}${p.gate}`} variant="label">
              {p.stationId} {p.gate}: {p.lat}, {p.lng} (±{p.accuracyM} m)
            </Text>
          ))}
          {points.length ? <Button label={`Share ${points.length} gate points (JSON)`} variant="secondary" fullWidth onPress={() => exportJson('gates-survey.json', points)} /> : null}
        </Stack>
      ) : (
        <Stack gap={3}>
          <Text tone="muted">Record a whole ride: start on the platform, stop after leaving the station. Record a bus ride under the line too: the detector must reject it.</Text>
          <Text variant="title">Detector: {phase}</Text>
          <Text variant="label" tone="muted">
            {rows.length} fixes
          </Text>
          <Button label={recording ? 'Stop recording' : 'Start recording'} fullWidth onPress={() => void toggleRecord()} />
          {rows.length && !recording ? <Button label="Share recording (JSON)" variant="secondary" fullWidth onPress={() => exportJson('ride-recording.json', rows)} /> : null}
        </Stack>
      )}
    </Screen>
  );
}
