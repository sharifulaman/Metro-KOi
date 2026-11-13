import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../Icon';
import { Text } from '../Text';

import type { GlassPillProps } from './types';

/** Small floating pill over the map: a status count, a zoom badge, "train at the station". */
export function GlassPill({ label, dot, icon, size = 'md', onPress, testID, accessibilityLabel }: GlassPillProps) {
  const { c, space, shadow } = useTheme();
  const h = size === 'sm' ? 28 : 32;
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        { height: h, borderRadius: h / 2, paddingHorizontal: space[3], flexDirection: 'row', alignItems: 'center', gap: space[2], alignSelf: 'flex-start', backgroundColor: c.glass, opacity: pressed ? 0.85 : 1 },
        shadow.float,
      ]}
    >
      {dot === 'live' ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.live }} /> : null}
      {dot === 'estimated' ? <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.6, borderStyle: 'dashed', borderColor: c.inkMuted }} /> : null}
      {icon ? <Icon name={icon} size={14} /> : null}
      <Text variant={size === 'sm' ? 'micro' : 'label'} weight={700} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export type { GlassPillProps } from './types';
