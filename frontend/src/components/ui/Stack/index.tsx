import { Children } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space } from '@/theme/tokens';

import type { StackProps } from './types';

const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' } as const;
const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' } as const;

const overlayStyle: Record<NonNullable<StackProps['overlay']>, ViewStyle> = {
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  topRight: { position: 'absolute', top: 0, right: 0 },
  bottomRight: { position: 'absolute', bottom: 0, right: 0 },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
};

export function Stack({ children, direction = 'column', gap = 0, pad, padX, padY, align, justify, wrap, flex, minH, equal, overlay, safe, testID }: StackProps) {
  const insets = useSafeAreaInsets();
  const py = padY != null ? space[padY] : pad != null ? space[pad] : 0;
  return (
    <View
      testID={testID}
      pointerEvents={overlay ? 'box-none' : undefined}
      style={[
        {
          flexDirection: direction,
          gap: space[gap],
          padding: pad != null ? space[pad] : undefined,
          paddingHorizontal: padX != null ? space[padX] : undefined,
          paddingVertical: padY != null ? space[padY] : undefined,
          alignItems: align ? alignMap[align] : direction === 'row' ? 'center' : undefined,
          justifyContent: justify ? justifyMap[justify] : undefined,
          flexWrap: wrap ? 'wrap' : undefined,
          flex: flex ? 1 : undefined,
          minHeight: minH,
          flexShrink: direction === 'row' ? 1 : undefined,
        },
        overlay ? overlayStyle[overlay] : null,
        safe === 'top' ? { paddingTop: insets.top + py } : null,
        safe === 'bottom' ? { paddingBottom: insets.bottom + py } : null,
      ]}
    >
      {equal ? Children.map(children, (child) => <View style={{ flex: 1 }}>{child}</View>) : children}
    </View>
  );
}

export type { StackProps } from './types';
