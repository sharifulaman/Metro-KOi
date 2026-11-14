import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { NavHeader } from '../NavHeader';
import { SavedCardRow } from '../SavedCardRow';

import type { SavedCardsViewProps } from './types';

/** Saved cards (design ৭): one white list card, privacy note, and "Add a new card" above the tab bar. */
export function SavedCardsView(p: SavedCardsViewProps) {
  const { c, size } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: size.tabBar + 52 + 48 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <NavHeader left={{ icon: 'back', label: p.backLabel, onPress: p.onBack }} title={p.title} right={{ icon: 'add', label: p.addLabel, onPress: p.onAdd }} />
        <View style={{ marginTop: 18, marginHorizontal: 20, borderRadius: 22, borderWidth: 1, borderColor: c.divider, backgroundColor: c.surface }}>
          {p.cards.map((card, i) => (
            <SavedCardRow
              key={card.id}
              testID={'saved-row-' + card.id}
              name={card.name}
              tail={card.tail}
              tailText={card.tailText}
              typeLabel={card.typeLabel}
              color={card.color}
              balance={card.balance}
              isDefault={card.isDefault}
              defaultLabel={p.defaultLabel}
              noBalanceLabel={p.noBalanceLabel}
              editLabel={p.editLabel}
              deleteLabel={p.deleteLabel}
              confirming={card.confirming}
              confirmText={p.confirmText}
              onPress={() => p.onSetDefault(card.id)}
              onEdit={() => p.onEdit(card.id)}
              onDelete={() => p.onDelete(card.id)}
              divider={i < p.cards.length - 1}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginHorizontal: 24 }}>
          <View style={{ marginTop: 1 }}>
            <Icon name="lock" size={18} color={c.onBrandTint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text size={13} lh={1.5} weight={400} tone="muted">
              {p.note}
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 110 + insets.bottom }}>
        <Button label={p.newCardLabel} icon="circlePlus" fullWidth onPress={p.onAdd} />
      </View>
    </View>
  );
}

export type { SavedCardsViewProps, SavedCardsViewCard } from './types';
