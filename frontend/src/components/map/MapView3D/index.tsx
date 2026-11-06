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
 * The MapLibre implementation (OpenFreeMap tiles, fill-extrusion buildings,
 * pitch 60°, needs a dev build) replaces the <Svg> body here and keeps the
 * same props, so no screen changes.
 */
export function MapView3D({ stations, trains, selectedStation, selectedTrain, onStationPress, onTrainPress, children, bottomInset = 0, reserveSheet, attribution, height, testID }: MapView3DProps) {
  const { c, space } = useTheme();
  const win = useWindowDimensions();
  const reserved = bottomInset + (reserveSheet ? win.height * layout.dockedSheet : 0);
  return (
    <View testID={testID} style={height ? { height, backgroundColor: c.mapGround } : { flex: 1, backgroundColor: c.mapGround }}>
      <View style={{ flex: 1, paddingBottom: reserved }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet">
          <Rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill={c.mapGround} />
          {/* north arrow */}
          <Path d="M370,60 L378,82 L370,77 L362,82 Z" fill={c.inkMuted} />
          <LineLayer d={pathD} />
          {stations.map((s, i) => {
            const p = pointAt(s.f);
            return (
              <StationPin
                key={s.id}
                x={p.x}
                y={p.y}
                label={s.label}
                side={i % 2 === 0 ? 'left' : 'right'}
                highlighted={s.id === selectedStation}
                onPress={onStationPress ? () => onStationPress(s.id) : undefined}
              />
            );
          })}
          {trains.map((t) => {
            const p = pointAt(t.f);
            return (
              <TrainMarker
                key={t.id}
                x={p.x}
                y={p.y}
                bearing={p.bearing}
                dir={t.dir}
                state={t.state}
                selected={t.id === selectedTrain}
                onPress={onTrainPress ? () => onTrainPress(t.id) : undefined}
              />
            );
          })}
        </Svg>
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
