import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';
import { LineLayer } from '../LineLayer';
import { pathD, pointAt, VIEW_H, VIEW_W } from '../lineShape';
import { StationPin } from '../StationPin';
import { TrainMarker } from '../TrainMarker';

import type { MapView3DProps } from './types';

/**
 * Live map: the real OSM track shape drawn as SVG (runs in Expo Go and web).
 * `zoom` > 1 frames a few stations around `focus` (follow a moving train by
 * passing its position each tick). Markers are sized in screen pixels, so
 * they stay readable at every zoom. The MapLibre implementation (OpenFreeMap
 * tiles, fill-extrusion buildings, pitch 60°, needs a dev build) replaces the
 * <Svg> body here and keeps the same props, so no screen changes.
 */
export function MapView3D({ stations, trains, selectedStation, selectedTrain, onStationPress, onTrainPress, children, bottomInset = 0, reserveSheet, attribution, height, zoom = 1, focus, topInset = 0, testID }: MapView3DProps) {
  const { c, space } = useTheme();
  const win = useWindowDimensions();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const reserved = bottomInset + (reserveSheet ? win.height * layout.dockedSheet : 0);

  // The map fills the whole area (it continues under the sheet); the line or
  // the focus point is framed in the part left visible between the floating
  // controls and the sheet. The viewBox matches the area so `k` is exact.
  let viewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  let k = 1;
  if (box.w > 0 && box.h > 0) {
    const top = Math.min(topInset, box.h * 0.4);
    const visH = Math.max(120, box.h - reserved - top);
    const ppu = Math.min(box.w / VIEW_W, visH / VIEW_H) * Math.max(1, zoom);
    const vw = box.w / ppu;
    const vh = box.h / ppu;
    const centre = zoom > 1 && focus != null ? pointAt(focus) : { x: VIEW_W / 2, y: VIEW_H / 2 };
    const y0 = centre.y - (top + visH / 2) / ppu;
    viewBox = `${(centre.x - vw / 2).toFixed(2)} ${y0.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`;
    k = 1 / ppu;
  }
  const dense = zoom < 2;

  return (
    <View testID={testID} style={height ? { height, backgroundColor: c.mapGround } : { flex: 1, backgroundColor: c.mapGround }}>
      <View style={{ flex: 1 }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
          <Rect x={-VIEW_W} y={-VIEW_H} width={VIEW_W * 3} height={VIEW_H * 3} fill={c.mapGround} />
          <LineLayer d={pathD} k={k} />
          {stations.map((s, i) => {
            const p = pointAt(s.f);
            return (
              <StationPin
                key={s.id}
                x={p.x}
                y={p.y}
                k={k}
                dense={dense}
                label={s.label}
                side={i % 2 === 0 ? 'left' : 'right'}
                highlighted={s.id === selectedStation}
                onPress={onStationPress ? () => onStationPress(s.id) : undefined}
              />
            );
          })}
          {trains.map((t) => {
            const p = pointAt(t.f);
            const selected = t.id === selectedTrain;
            return (
              <TrainMarker
                key={t.id}
                x={p.x}
                y={p.y}
                k={k}
                dense={dense}
                bearing={p.bearing}
                dir={t.dir}
                state={t.state}
                selected={selected}
                label={selected ? t.label : undefined}
                onPress={onTrainPress ? () => onTrainPress(t.id) : undefined}
              />
            );
          })}
        </Svg>
        {/* north arrow, fixed on screen */}
        <View pointerEvents="none" style={{ position: 'absolute', right: space[5], bottom: reserved + space[3] }}>
          <Svg width={16} height={24} viewBox="0 0 16 24">
            <Path d="M8,0 L16,22 L8,17 L0,22 Z" fill={c.inkMuted} />
          </Svg>
        </View>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: space[3], bottom: reserved + space[2] }}>
        <Text variant="micro" tone="muted">
          {attribution}
        </Text>
      </View>
      {children}
    </View>
  );
}

export type { MapStation, MapTrain, MapView3DProps } from './types';
