import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Text } from '../Text';

import type { SectionLabelProps } from './types';

export function SectionLabel({ text, colorDot, right, testID }: SectionLabelProps) {
  const { space } = useTheme();
  return (
    <View testID={testID} accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: space[2], paddingTop: space[2] }}>
      {colorDot ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorDot }} /> : null}
      <View style={{ flex: 1 }}>
        <Text variant="label" tone="muted" weight={600}>
          {text}
        </Text>
      </View>
      {right}
    </View>
  );
}

export type { SectionLabelProps } from './types';
