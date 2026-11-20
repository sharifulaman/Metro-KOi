import { Children, useState, type ReactNode } from 'react';
import { ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { useTheme } from '@/theme/useTheme';

/** Alerts side by side: swipe left / right to see the next one; dots show which one is open. */
export function AlertSlider({ children, testID }: { children: ReactNode; testID?: string }) {
  const { c, space } = useTheme();
  const items = Children.toArray(children);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  if (items.length === 0) return null;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };
  return (
    <View onLayout={onLayout} testID={testID} style={{ gap: space[2] }}>
      {width > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onEnd} nestedScrollEnabled>
          {items.map((item, i) => (
            <View key={i} style={{ width }}>
              {item}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View>{items[0]}</View>
      )}
      {items.length > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {items.map((_, i) => (
            <View key={i} style={{ width: i === page ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? c.brandSolid : c.divider }} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
