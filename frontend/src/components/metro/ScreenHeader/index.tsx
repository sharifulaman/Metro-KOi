import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { IconButton } from '../../ui/IconButton';
import { Text } from '../../ui/Text';

import type { ScreenHeaderProps } from './types';

export function ScreenHeader({ title, subtitle, onBack, backLabel = 'Back', right, testID }: ScreenHeaderProps) {
  const { space } = useTheme();
  return (
    <View testID={testID} style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 48 }}>
      {onBack ? <IconButton icon="back" onPress={onBack} accessibilityLabel={backLabel} elevated /> : null}
      <View style={{ flex: 1 }}>
        <Text variant="heading" numberOfLines={2} accessibilityLabel={title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export type { ScreenHeaderProps } from './types';
