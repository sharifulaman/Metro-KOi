import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';

import type { LineDiagramProps } from './types';

const ROW = 34;

export function LineDiagram({ stations, trains = [], highlightStation, range, orientation = 'vertical', testID }: LineDiagramProps) {
  const { c, space } = useTheme();
  const n = stations.length;
  const inRange = (i: number) => !!range && i >= Math.min(...range) && i <= Math.max(...range);

  if (orientation === 'horizontal') {
    const W = 340;
    const x = (i: number) => 14 + (i * (W - 28)) / Math.max(1, n - 1);
    const first = stations[0];
    const last = stations[n - 1];
    const hl = stations.findIndex((s) => s.id === highlightStation);
    return (
      <View testID={testID} style={{ gap: space[1] }}>
        <Svg width="100%" height={36} viewBox={`0 0 ${W} 36`}>
          <Line x1={x(0)} y1={18} x2={x(n - 1)} y2={18} stroke={c.divider} strokeWidth={5} strokeLinecap="round" />
          {range ? <Line x1={x(Math.min(...range))} y1={18} x2={x(Math.max(...range))} y2={18} stroke={c.brand} strokeWidth={5} strokeLinecap="round" /> : null}
          {stations.map((s, i) => (
            <Circle key={s.id} cx={x(i)} cy={18} r={i === hl ? 6 : 3.5} fill={c.surface} stroke={inRange(i) || i === hl ? c.brandDeep : c.outline} strokeWidth={2} />
          ))}
          {trains.map((t) => (
            <Path
              key={t.id}
              d={t.dir === 'SB' ? `M${x(t.pos) - 7},10 L${x(t.pos) + 7},18 L${x(t.pos) - 7},26 Z` : `M${x(t.pos) + 7},10 L${x(t.pos) - 7},18 L${x(t.pos) + 7},26 Z`}
              fill={t.state === 'LIVE' ? c.live : c.estimated}
            />
          ))}
        </Svg>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="micro" tone="muted">
            {first?.label}
          </Text>
          {hl > 0 && hl < n - 1 ? (
            <Text variant="micro" weight={700}>
              {stations[hl].label}
            </Text>
          ) : null}
          <Text variant="micro" tone="muted">
            {last?.label}
          </Text>
        </View>
      </View>
    );
  }

  const H = ROW * n;
  return (
    <View testID={testID} style={{ flexDirection: 'row' }}>
      <Svg width={40} height={H}>
        <Line x1={20} y1={ROW / 2} x2={20} y2={H - ROW / 2} stroke={c.divider} strokeWidth={5} strokeLinecap="round" />
        {range ? (
          <Line x1={20} y1={Math.min(...range) * ROW + ROW / 2} x2={20} y2={Math.max(...range) * ROW + ROW / 2} stroke={c.brand} strokeWidth={5} strokeLinecap="round" />
        ) : null}
        {stations.map((s, i) => (
          <Circle key={s.id} cx={20} cy={i * ROW + ROW / 2} r={s.id === highlightStation ? 7 : 5} fill={c.surface} stroke={inRange(i) || s.id === highlightStation ? c.brandDeep : c.outline} strokeWidth={2.5} />
        ))}
        {trains.map((t) => {
          const y = t.pos * ROW + ROW / 2;
          return (
            <Path
              key={t.id}
              d={t.dir === 'SB' ? `M12,${y - 8} L28,${y - 8} L20,${y + 8} Z` : `M12,${y + 8} L28,${y + 8} L20,${y - 8} Z`}
              fill={t.state === 'LIVE' ? c.live : c.surface}
              stroke={t.state === 'LIVE' ? c.surface : c.estimated}
              strokeDasharray={t.state === 'LIVE' ? undefined : '3,2'}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
      <View style={{ flex: 1 }}>
        {stations.map((s, i) => (
          <View key={s.id} style={{ height: ROW, justifyContent: 'center' }}>
            <Text variant="label" weight={s.id === highlightStation || inRange(i) ? 700 : 500} tone={s.id === highlightStation || inRange(i) ? 'ink' : 'muted'} numberOfLines={1}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export type { LineDiagramProps, LineDiagramStation, LineDiagramTrain } from './types';
