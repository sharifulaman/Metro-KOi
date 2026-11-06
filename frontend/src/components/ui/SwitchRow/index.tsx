import { Switch, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Text } from '../Text';

import type { SwitchRowProps } from './types';

export function SwitchRow({ label, subtitle, value, onValueChange, divider, disabled, testID }: SwitchRowProps) {
  const { c, size, space } = useTheme();
  return (
    <View
      style={{
        minHeight: size.row,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: c.divider,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text weight={500}>{label}</Text>
        {subtitle ? (
          <Text variant="label" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        testID={testID}
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ true: c.brand, false: c.outline }}
        thumbColor={c.surface}
      />
    </View>
  );
}

export type { SwitchRowProps } from './types';
