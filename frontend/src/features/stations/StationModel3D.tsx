import { useMemo, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

/** One box of the model: world metres, x along the track, y across it, z up. */
interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  color: string;
  opacity?: number;
}

export interface ModelGate {
  letter: string;
  label: string;
  corner: 'NW' | 'NE' | 'SW' | 'SE';
  selected: boolean;
  onPress(): void;
}


const GROUND = '#EFEBE1';
const STREET = '#FFFFFF';
const HOUSE = '#D9D2C3';
const STATION = '#E8A58B';
const DECK = '#C9CDCB';
const CANOPY = '#7FD1B0';
const CAR = '#F4F6F5';
const STRIPE = '#0A8F5F';
const GLASS = '#2B3A36';
const STAIR = '#0B7A55';

function scene(withTrain: boolean): Box[] {
  const b: Box[] = [
    { x0: -95, x1: 95, y0: -62, y1: 62, z0: -1, z1: 0, color: GROUND },
    { x0: -95, x1: 95, y0: -34, y1: -26, z0: 0, z1: 0.2, color: STREET },
    { x0: -95, x1: 95, y0: 26, y1: 34, z0: 0, z1: 0.2, color: STREET },
    { x0: 40, x1: 48, y0: -62, y1: 62, z0: 0, z1: 0.2, color: STREET },
    // neighbouring buildings
    { x0: -88, x1: -60, y0: -58, y1: -38, z0: 0, z1: 16, color: HOUSE },
    { x0: -52, x1: -30, y0: 38, y1: 58, z0: 0, z1: 22, color: HOUSE },
    { x0: 56, x1: 88, y0: 38, y1: 58, z0: 0, z1: 12, color: HOUSE },
    { x0: 58, x1: 86, y0: -58, y1: -38, z0: 0, z1: 18, color: HOUSE },
    // station: concourse under the viaduct, deck, platform roof
    { x0: -24, x1: 24, y0: -12, y1: 12, z0: 0, z1: 8, color: STATION },
    { x0: -95, x1: 95, y0: -10, y1: 10, z0: 8, z1: 10, color: DECK },
    // two tracks, and a platform on each side: 1 (south) towards Motijheel, 2 (north) towards Uttara North
    { x0: -95, x1: 95, y0: -5, y1: 5, z0: 10, z1: 10.3, color: '#9BA19E' },
    { x0: -30, x1: 30, y0: -10, y1: -5.6, z0: 10, z1: 10.9, color: '#E4E7E5' },
    { x0: -30, x1: 30, y0: 5.6, y1: 10, z0: 10, z1: 10.9, color: '#E4E7E5' },
    { x0: -30, x1: 30, y0: -5.9, y1: -5.6, z0: 10.9, z1: 11.1, color: '#F2C230' },
    { x0: -30, x1: 30, y0: 5.6, y1: 5.9, z0: 10.9, z1: 11.1, color: '#F2C230' },
    { x0: -30, x1: 30, y0: -10, y1: 10, z0: 17, z1: 18, color: CANOPY, opacity: 0.45 },
    { x0: -30, x1: -29, y0: -10, y1: -9, z0: 10, z1: 17, color: CANOPY, opacity: 0.8 },
    { x0: 29, x1: 30, y0: -10, y1: -9, z0: 10, z1: 17, color: CANOPY, opacity: 0.8 },
    { x0: -30, x1: -29, y0: 9, y1: 10, z0: 10, z1: 17, color: CANOPY, opacity: 0.8 },
    { x0: 29, x1: 30, y0: 9, y1: 10, z0: 10, z1: 17, color: CANOPY, opacity: 0.8 },
    // platform sign posts
    { x0: -0.5, x1: 0.5, y0: -8.6, y1: -7.6, z0: 10.9, z1: 16, color: STAIR },
    { x0: -0.5, x1: 0.5, y0: 7.6, y1: 8.6, z0: 10.9, z1: 16, color: STAIR },
  ];
  if (withTrain) {
    for (let i = 0; i < 4; i++) {
      const x0 = -29 + i * 15;
      b.push({ x0, x1: x0 + 14, y0: -4.8, y1: -0.2, z0: 10.3, z1: 14.8, color: CAR });
      b.push({ x0, x1: x0 + 14, y0: -4.9, y1: -0.1, z0: 11.3, z1: 12.2, color: STRIPE });
      b.push({ x0: x0 + 1, x1: x0 + 13, y0: -4.95, y1: -0.05, z0: 12.9, z1: 14.1, color: GLASS });
    }
  }
  return b;
}

const CORNER_ORDER: ModelGate['corner'][] = ['NW', 'NE', 'SE', 'SW'];

/** One gate per corner: a gate whose corner is already taken moves to the nearest free one. */
function distinctCorners(gates: ModelGate[]): ModelGate['corner'][] {
  const taken = new Set<ModelGate['corner']>();
  return gates.map((g) => {
    let c = g.corner;
    if (taken.has(c)) {
      const i = CORNER_ORDER.indexOf(c);
      for (const d of [1, 3, 2]) {
        const n = CORNER_ORDER[(i + d) % 4];
        if (!taken.has(n)) {
          c = n;
          break;
        }
      }
    }
    taken.add(c);
    return c;
  });
}

/** Entrance positions (stair block + pin anchor) for each corner of the station. */
const CORNER: Record<ModelGate['corner'], { x: number; y: number }> = {
  NW: { x: -34, y: 20 },
  NE: { x: 34, y: 20 },
  SW: { x: -34, y: -20 },
  SE: { x: 34, y: -20 },
};

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

/**
 * The station as a small 3D model you can turn with one finger: the viaduct, the station, the train and the
 * gate entrances with their landmark names. Drawn with SVG (no map, no 3D library).
 */
export function StationModel3D({ gates, trainTag, signs, withTrain = true }: { gates?: ModelGate[]; trainTag?: string; /** platform signs: where each platform goes */ signs?: { south: string; north: string }; withTrain?: boolean }) {
  const { c } = useTheme();
  const [yaw, setYaw] = useState(-0.7);
  const [pitchDeg, setPitchDeg] = useState(52);
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ w: 390, h: 262 });
  // Touch: one finger sideways turns the model; two fingers pinch to zoom and slide up / down to tilt.
  // A mostly vertical one-finger drag is left to the page so it can still scroll.
  const [pan] = useState(() => {
    let lastDx = 0;
    let lastDy = 0;
    let lastDist = 0;
    let lastCount = 1;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.numberActiveTouches >= 2 || (Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5),
      onPanResponderGrant: () => {
        lastDx = 0;
        lastDy = 0;
        lastDist = 0;
        lastCount = 1;
      },
      onPanResponderMove: (e, g) => {
        const touches = e.nativeEvent.touches;
        if (touches.length !== lastCount) {
          lastCount = touches.length;
          lastDx = g.dx;
          lastDy = g.dy;
          lastDist = 0;
        }
        if (touches.length >= 2) {
          const dist = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
          if (lastDist > 0 && dist > 0) setZoom((z) => Math.max(0.6, Math.min(2.4, (z * dist) / lastDist)));
          lastDist = dist;
          setPitchDeg((d) => Math.max(30, Math.min(85, d + (g.dy - lastDy) * 0.25)));
        } else {
          setYaw((y) => y + (g.dx - lastDx) * 0.012);
        }
        lastDx = g.dx;
        lastDy = g.dy;
      },
    });
  });

  const corners = useMemo(() => distinctCorners(gates ?? []), [gates]);
  const boxes = useMemo(() => {
    const entrances: Box[] = corners.map((cn) => {
      const p = CORNER[cn];
      return { x0: p.x - 4, x1: p.x + 4, y0: p.y - 4, y1: p.y + 4, z0: 0, z1: 4, color: STAIR };
    });
    return [...scene(withTrain), ...entrances];
  }, [corners, withTrain]);

  const PITCH = (pitchDeg * Math.PI) / 180;
  const cx = Math.cos(yaw);
  const sx = Math.sin(yaw);
  const cam = [cx * Math.cos(PITCH), sx * Math.cos(PITCH), Math.sin(PITCH)] as const;
  const right = [-sx, cx, 0] as const;
  const up = [-cx * Math.sin(PITCH), -sx * Math.sin(PITCH), Math.cos(PITCH)] as const;
  const scale = Math.min(size.w / 175, size.h / 105) * zoom;
  const ox = size.w / 2;
  const oy = size.h * 0.56;
  const proj = (x: number, y: number, z: number) => ({
    x: ox + (x * right[0] + y * right[1]) * scale,
    y: oy - (x * up[0] + y * up[1] + z * up[2]) * scale,
  });

  const faces: { key: string; pts: string; fill: string; opacity: number; depth: number }[] = [];
  boxes.forEach((b, bi) => {
    const mid = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2];
    const depth = mid[0] * cam[0] + mid[1] * cam[1] + mid[2] * cam[2];
    const defs: { n: [number, number, number]; v: [number, number, number][]; k: number }[] = [
      { n: [0, 0, 1], v: [[b.x0, b.y0, b.z1], [b.x1, b.y0, b.z1], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]], k: 1.04 },
      { n: [1, 0, 0], v: [[b.x1, b.y0, b.z0], [b.x1, b.y1, b.z0], [b.x1, b.y1, b.z1], [b.x1, b.y0, b.z1]], k: 0.82 },
      { n: [-1, 0, 0], v: [[b.x0, b.y0, b.z0], [b.x0, b.y1, b.z0], [b.x0, b.y1, b.z1], [b.x0, b.y0, b.z1]], k: 0.9 },
      { n: [0, 1, 0], v: [[b.x0, b.y1, b.z0], [b.x1, b.y1, b.z0], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]], k: 0.74 },
      { n: [0, -1, 0], v: [[b.x0, b.y0, b.z0], [b.x1, b.y0, b.z0], [b.x1, b.y0, b.z1], [b.x0, b.y0, b.z1]], k: 0.96 },
    ];
    defs.forEach((f, fi) => {
      if (f.n[0] * cam[0] + f.n[1] * cam[1] + f.n[2] * cam[2] <= 0) return;
      const pts = f.v.map((p) => proj(p[0], p[1], p[2])).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      faces.push({ key: `${bi}-${fi}`, pts, fill: shade(b.color, f.k), opacity: b.opacity ?? 1, depth });
    });
  });
  faces.sort((a, b) => a.depth - b.depth);

  const pinAt = (g: ModelGate, i: number) => {
    const p = CORNER[corners[i] ?? g.corner];
    return proj(p.x, p.y, 6);
  };
  const trainAt = proj(-12, -2.5, 19);
  const signSouth = proj(0, -8.1, 18);
  const signNorth = proj(0, 8.1, 18);

  return (
    <View
      {...pan.panHandlers}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[{ flex: 1, backgroundColor: GROUND, overflow: 'hidden' }, { touchAction: 'pan-y' } as object]}
    >
      <Svg width="100%" height="100%" pointerEvents="none">
        {faces.map((f) => (
          <Polygon key={f.key} points={f.pts} fill={f.fill} fillOpacity={f.opacity} stroke={f.fill} strokeWidth={0.6} strokeLinejoin="round" />
        ))}
      </Svg>
      {signs
        ? [
            { at: signSouth, text: signs.south },
            { at: signNorth, text: signs.north },
          ].map((s, i) => (
            <View key={i} pointerEvents="none" style={{ position: 'absolute', left: s.at.x - 80, top: s.at.y - 12, width: 160, alignItems: 'center' }}>
              <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#0B7A55', borderWidth: 1.5, borderColor: '#FFFFFF' }}>
                <Text size={10.5} lh={1.25} weight={700} color="#FFFFFF" align="center" numberOfLines={2}>
                  {s.text}
                </Text>
              </View>
            </View>
          ))
        : null}
      {trainTag ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: trainAt.x - 90, top: trainAt.y - 22, width: 180, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#0B0F0E', borderWidth: 1.5, borderColor: '#F2C230' }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#F59E0B' }} />
            <Text size={11.5} lh={1.3} weight={700} color="#FFFFFF">
              {trainTag}
            </Text>
          </View>
        </View>
      ) : null}
      {(gates ?? []).map((g, i) => {
        const p = pinAt(g, i);
        return (
          <View key={g.letter} pointerEvents="box-none" style={{ position: 'absolute', left: p.x - 70, top: p.y - 52, width: 140, alignItems: 'center' }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${g.letter} ${g.label}`} onPress={g.onPress} style={{ alignItems: 'center' }}>
              <View style={{ width: g.selected ? 38 : 30, height: g.selected ? 38 : 30, borderRadius: 19, backgroundColor: g.selected ? c.brandDeep : c.brandSolid, borderWidth: 2.5, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(14,26,22,0.35)' }}>
                <Text size={g.selected ? 17 : 14} lh={1.2} weight={700} color="#FFFFFF">
                  {g.letter}
                </Text>
              </View>
              <View style={{ width: 2, height: 6, backgroundColor: g.selected ? c.brandDeep : c.brandSolid }} />
              {g.label ? (
                <View style={{ marginTop: 1, maxWidth: 140, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: g.selected ? c.brandDeep : 'rgba(255,255,255,0.95)' }}>
                  <Text size={10.5} lh={1.25} weight={700} color={g.selected ? '#FFFFFF' : '#0E1A16'} align="center" numberOfLines={1}>
                    {g.label}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
