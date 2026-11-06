import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { LiveDot } from '../../ui/StatusBadge';
import { Text } from '../../ui/Text';

import type { ConnectionPillProps } from './types';

export function ConnectionPill({ state, label, testID }: ConnectionPillProps) {
  const { c, space, radius, size, shadow } = useTheme();
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      accessibilityLabel={label}
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: space[1], minHeight: size.chipH, paddingHorizontal: space[3], borderRadius: radius.chip, backgroundColor: c.surface, alignSelf: 'flex-start' },
        shadow.float,
      ]}
    >
      {state === 'live' ? <LiveDot size={7} /> : <Icon name={state === 'offline' ? 'offline' : 'live'} size={15} tone={state === 'offline' ? 'muted' : 'live'} />}
      <Text variant="label" weight={600} tone={state === 'live' ? 'ink' : 'muted'} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export type { ConnectionPillProps } from './types';
