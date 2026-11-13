import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { Text } from '../Text';

import type { SegmentedProps } from './types';

export function Segmented<T extends string>({ options, value, onChange, variant = 'pill', selectedTone = 'surface', testID }: SegmentedProps<T>) {
  const { c, radius, size, space, shadow } = useTheme();
  if (variant === 'tabs') {
    return (
      <View testID={testID} accessibilityRole="tablist" style={{ flexDirection: 'row', gap: space[2], flexWrap: 'wrap' }}>
        {options.map((o) => (
          <Chip key={o.value} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
        ))}
      </View>
    );
  }
  const brand = selectedTone === 'brand';
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: radius.chip, padding: space[1], gap: space[1] }}
    >
      {options.map((o) => {
        const sel = o.value === value;
        const tone = sel ? (brand ? 'onBrand' : 'ink') : 'muted';
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            onPress={() => onChange(o.value)}
            style={[
              {
                flex: 1,
                minHeight: size.chipH,
                borderRadius: radius.chip,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space[1],
                paddingHorizontal: space[2],
                backgroundColor: sel ? (brand ? c.brandDeep : c.surface) : 'transparent',
              },
              sel && !brand ? shadow.card : null,
            ]}
          >
            {o.icon ? <Icon name={o.icon} size={16} tone={tone} /> : null}
            <Text variant="label" weight={sel ? 700 : 500} tone={tone} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export type { SegmentedOption, SegmentedProps } from './types';
