import { useRef } from 'react';
import { Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { CardArt } from '../CardArt';

import type { WalletCarouselProps } from './types';

const CARD_W = 326;
const GAP = 12;
const STEP = CARD_W + GAP;

/** Horizontally paged strip of saved cards, with a dot per card (Card tab home). */
export function WalletCarousel({ cards, index, onIndexChange, onPressCard, testID }: WalletCarouselProps) {
  const { c, space } = useTheme();
  const scrolling = useRef(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrolling.current = true;
    const i = Math.round(e.nativeEvent.contentOffset.x / STEP);
    if (i !== index && i >= 0 && i < cards.length) onIndexChange(i);
  };

  return (
    <View testID={testID} style={{ gap: space[3] }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={STEP}
        snapToAlignment="start"
        contentContainerStyle={{ paddingLeft: space[6], gap: GAP }}
        scrollEventThrottle={32}
        onScroll={onScroll}
        onMomentumScrollEnd={onScroll}
      >
        {cards.map((card) => (
          <Pressable key={card.id} onPress={() => onPressCard?.(card.id)} accessibilityRole="button" accessibilityLabel={card.name}>
            <CardArt name={card.name} tail={card.tail} typeLabel={card.typeLabel} color={card.color} width={CARD_W} />
          </Pressable>
        ))}
      </ScrollView>
      {cards.length > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space[1] }}>
          {cards.map((card, i) => (
            <View
              key={card.id}
              style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? c.brand : c.outline }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export type { WalletCarouselCard, WalletCarouselProps } from './types';
