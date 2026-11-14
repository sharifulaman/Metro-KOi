import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { TransactionRow } from '../TransactionRow';
import { WalletCarousel } from '../WalletCarousel';

import type { WalletHomeProps } from './types';

/**
 * Card tab home, built to the design's measurements (artboard 1 / 4 / 9):
 * header, saved-cards carousel, balance panel (read / no-info), actions, recent trips.
 */
export function WalletHome(p: WalletHomeProps) {
  const { c, size } = useTheme();
  const insets = useSafeAreaInsets();
  const known = p.balance.amount != null;
  return (
    <ScrollView
      testID={p.testID}
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 30, paddingBottom: size.tabBar + insets.bottom + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 24 }}>
        <View style={{ flex: 1 }}>
          <Text size={30} lh={1.25} weight={700}>
            {p.title}
          </Text>
          <Text size={14} lh={1.4} tone="muted" weight={400}>
            {p.subtitle}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={p.addLabel}
          onPress={p.onAdd}
          style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: c.outline, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="add" size={22} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginHorizontal: 24 }}>
        <Text size={14} lh={1.4} weight={700} tone="muted">
          {p.savedLabel}
        </Text>
        <Pressable accessibilityRole="button" onPress={p.onViewAll} hitSlop={8}>
          <Text size={14} lh={1.4} weight={700} color={c.onBrandTint}>
            {p.viewAllLabel}
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 10 }}>
        <WalletCarousel cards={p.cards} index={p.index} onIndexChange={p.onIndexChange} hideDots={known} />
      </View>

      <View style={{ marginTop: 14, marginHorizontal: 24, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 22, borderWidth: 1, borderColor: c.divider, backgroundColor: c.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text size={13.5} lh={1.4} tone="muted" weight={400}>
            {p.balance.label}
          </Text>
          <Badge label={p.balance.badgeLabel} tone={p.balance.badgeTone} icon={known ? 'nfc' : undefined} />
        </View>
        {known ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <Text size={24} weight={700} tone="muted" lh={1.2}>
              ৳
            </Text>
            <Text size={42} lh={1.2} weight={700} tracking={-0.5} numeric>
              {p.balance.amount}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="warning" size={22} tone="muted" />
            </View>
            <Text size={24} lh={1.3} weight={700}>
              {p.balance.noInfoTitle}
            </Text>
          </View>
        )}
        <View style={{ marginTop: known ? 0 : 8 }}>
          <Text size={13} lh={known ? 1.4 : 1.45} tone="muted" weight={400}>
            {p.balance.caption}
          </Text>
        </View>
      </View>

      {known && p.cards.length > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          {p.cards.map((card, i) => (
            <View key={card.id} style={{ width: i === p.index ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === p.index ? c.brand : c.outline }} />
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: 14, marginHorizontal: 24 }}>
        <Button label={p.scanLabel} icon="nfc" fullWidth onPress={p.onScan} testID="wallet-scan" />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Button label={p.historyLabel} icon="clock" variant="secondary" size="md" fullWidth onPress={p.onHistory} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={p.editLabel} icon="edit" variant="secondary" size="md" fullWidth onPress={p.onEdit} />
          </View>
        </View>
      </View>

      {p.recent.length > 0 ? (
        <>
          <View style={{ marginTop: 16, marginBottom: 6, marginHorizontal: 24 }}>
            <Text size={14} lh={1.4} weight={700} tone="muted">
              {p.recentLabel}
            </Text>
          </View>
          <View style={{ marginHorizontal: 24, borderRadius: 22, borderWidth: 1, borderColor: c.divider, backgroundColor: c.surface }}>
            {p.recent.map((r, i) => (
              <TransactionRow key={r.id} kind={r.kind} title={r.title} time={r.when} amount={r.amount} divider={i < p.recent.length - 1} />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

export type { WalletHomeProps, WalletHomeCard, WalletHomeTrip, WalletHomeBalance } from './types';
