import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../Icon';
import { Text, type TextTone } from '../Text';

import type { BadgeProps } from './types';

/** The small status pill used across the design (3×10 padding, 12.5px/600): "Read from card", "Live", "Default"… */
export function Badge({ label, tone = 'neutral', icon, dot, testID }: BadgeProps) {
  const { c } = useTheme();
  const bg = { brand: c.brandTint, neutral: c.surfaceAlt, live: c.liveTint, danger: c.dangerTint }[tone];
  const fg: TextTone = { brand: 'brand', neutral: 'muted', live: 'live', danger: 'danger' }[tone] as TextTone;
  const color = { brand: c.onBrandTint, neutral: c.inkMuted, live: c.onLiveTint, danger: c.danger }[tone];
  return (
    <View
      testID={testID}
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: bg }}
    >
      {dot === 'live' ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.live }} /> : null}
      {dot === 'estimated' ? <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.6, borderStyle: 'dashed', borderColor: c.inkMuted }} /> : null}
      {icon ? <Icon name={icon} size={14} color={color} strokeWidth={2.2} /> : null}
      <Text size={12.5} weight={600} lh={1.4} tone={fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export type { BadgeProps, BadgeTone } from './types';
