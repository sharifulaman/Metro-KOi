import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../Icon';
import { Text } from '../Text';

import type { InfoNoteProps } from './types';

export function InfoNote({ text, icon = 'info', tone = 'neutral', action, testID }: InfoNoteProps) {
  const { c, radius, space } = useTheme();
  const bg = tone === 'live' ? c.liveTint : tone === 'danger' ? c.dangerTint : c.surfaceAlt;
  const fg = tone === 'live' ? 'live' : tone === 'danger' ? 'danger' : 'muted';
  return (
    <View testID={testID} style={{ flexDirection: 'row', gap: space[3], padding: space[3], borderRadius: radius.note, backgroundColor: bg, alignItems: 'flex-start' }}>
      <Icon name={icon} size={18} tone={fg} />
      <View style={{ flex: 1, gap: space[1] }}>
        <Text variant="label" tone={fg === 'muted' ? 'muted' : fg}>
          {text}
        </Text>
        {action ? (
          <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
            <Text variant="label" weight={700} tone="brand">
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export type { InfoNoteProps } from './types';
