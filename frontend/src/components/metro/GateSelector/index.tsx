import { View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

import { GatePin } from '../../map/GatePin';
import { WalkingPathLayer } from '../../map/WalkingPathLayer';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { IconTile } from '../../ui/IconTile';
import { Text } from '../../ui/Text';

import type { GateSelectorProps } from './types';

const PIN_POS = { NW: [70, 70], NE: [270, 70], SW: [70, 190], SE: [270, 190] } as const;

/** One component for chips (route + 3D panel), cards (Gates screen) and pins (plan / scene). */
export function GateSelector({ gates, selected, recommended, variant, onSelect, labels, testID }: GateSelectorProps) {
  const { c, space, radius } = useTheme();

  if (variant === 'chips') {
    return (
      <View testID={testID} style={{ flexDirection: 'row', gap: space[2], flexWrap: 'wrap' }}>
        {gates.map((g) => (
          <Chip key={g.gate} label={labels.gate(g.gate)} selected={g.gate === selected} dot={g.gate === recommended ? c.brand : undefined} onPress={() => onSelect(g.gate)} />
        ))}
      </View>
    );
  }

  if (variant === 'pins') {
    const sel = gates.find((g) => g.gate === selected);
    return (
      <View testID={testID} style={{ borderRadius: radius.card, overflow: 'hidden', backgroundColor: c.mapGround }}>
        <Svg width="100%" height={260} viewBox="0 0 340 260">
          <Rect x={0} y={112} width={340} height={36} fill={c.mapRoad} />
          <Rect x={152} y={0} width={36} height={260} fill={c.mapRoad} />
          <Line x1={0} y1={130} x2={340} y2={130} stroke={c.brand} strokeWidth={6} />
          <Rect x={110} y={104} width={120} height={52} rx={10} fill={c.brandTint} stroke={c.brand} strokeWidth={2} />
          {sel ? <WalkingPathLayer d={`M${PIN_POS[sel.corner][0]},${PIN_POS[sel.corner][1]} L170,130`} /> : null}
          {gates.map((g) => (
            <GatePin key={g.gate} x={PIN_POS[g.corner][0]} y={PIN_POS[g.corner][1]} gate={g.gate} selected={g.gate === selected} recommended={g.gate === recommended} onPress={() => onSelect(g.gate)} />
          ))}
        </Svg>
      </View>
    );
  }

  const facility = (v: boolean | null | undefined, label: string) => (v === true ? label : null);
  return (
    <View testID={testID} style={{ gap: space[2] }}>
      {gates.map((g) => {
        const facilities = [facility(g.hasLift, labels.lift), facility(g.hasEscalator, labels.escalator)].filter(Boolean) as string[];
        const unknown = g.hasLift == null || g.hasEscalator == null;
        return (
          <Card key={g.gate} elevated={g.gate === selected} tone={g.gate === selected ? 'surface' : 'alt'} padding={3} onPress={() => onSelect(g.gate)} accessibilityLabel={labels.gate(g.gate)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
              <IconTile icon="gate" letter={g.gate} tone={g.gate === selected ? 'brand' : 'neutral'} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight={600}>{g.landmark ?? labels.corner(g.corner)}</Text>
                <Text variant="label" tone="muted">
                  {[...facilities, unknown ? labels.unknown : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {g.gate === recommended ? <Chip label={labels.nearest} tone="brand" /> : null}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

export type { GateItem, GateSelectorProps } from './types';
