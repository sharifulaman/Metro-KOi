import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { EmptyStateProps } from './types';

export function EmptyState({ icon, title, body, action, compact, testID }: EmptyStateProps) {
  const { c, space } = useTheme();
  return (
    <View testID={testID} style={{ alignItems: 'center', gap: space[3], paddingVertical: compact ? space[4] : space[7] }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={28} tone="muted" />
      </View>
      <Text variant="title" align="center">
        {title}
      </Text>
      {body ? (
        <Text tone="muted" align="center">
          {body}
        </Text>
      ) : null}
      {action ? (
        <View style={{ alignSelf: 'center', maxWidth: '100%' }}>
          <Button label={action.label} onPress={action.onPress} variant="secondary" size="md" />
        </View>
      ) : null}
    </View>
  );
}

export type { EmptyStateProps } from './types';
