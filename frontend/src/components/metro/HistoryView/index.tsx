import { Pressable, ScrollView, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { EmptyState } from '../EmptyState';
import { NavHeader } from '../NavHeader';
import { TransactionRow } from '../TransactionRow';

import type { HistoryViewProps } from './types';

/** Trip history (design ৮): month summary, privacy note + clear link, All/Trips/Recharges pill, day groups. */
export function HistoryView(p: HistoryViewProps) {
  const { c, size } = useTheme();
  return (
    <ScrollView testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: size.tabBar + 16 }} showsVerticalScrollIndicator={false}>
      <NavHeader left={{ icon: 'back', label: p.backLabel, onPress: p.onBack }} title={p.title} />

      <View style={{ marginTop: 16, marginHorizontal: 20, paddingHorizontal: 18, paddingVertical: 16, borderRadius: 24, backgroundColor: c.brandDeep, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text size={13} lh={1.4} weight={400} color="rgba(255,255,255,0.85)">
            {p.tripsLabel}
          </Text>
          <Text size={30} lh={1.25} weight={700} tone="onBrand">
            {p.trips}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text size={13} lh={1.4} weight={400} color="rgba(255,255,255,0.85)">
            {p.spendLabel}
          </Text>
          <Text size={30} lh={1.25} weight={700} tone="onBrand">
            {p.spend}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
          <Icon name="lock" size={16} tone="muted" />
          <Text size={12.5} lh={1.4} weight={400} tone="muted" numberOfLines={1}>
            {p.privacyNote}
          </Text>
        </View>
        {p.canClear ? (
          <Pressable accessibilityRole="button" onPress={p.onClear} testID="history-clear" style={{ height: 40, paddingHorizontal: 6, justifyContent: 'center' }}>
            <Text size={14} lh={1.35} weight={600} color={c.dangerInk}>
              {p.clearLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View accessibilityRole="tablist" style={{ flexDirection: 'row', marginTop: 14, marginHorizontal: 20, padding: 4, borderRadius: 999, backgroundColor: c.surfaceAlt }}>
        {p.tabs.map((tab) => {
          const sel = tab.value === p.filter;
          return (
            <Pressable
              key={tab.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: sel }}
              onPress={() => p.onFilter(tab.value)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 999, backgroundColor: sel ? c.surface : 'transparent', boxShadow: sel ? '0 1px 4px rgba(14,26,22,0.12)' : undefined }}
            >
              <Text size={14} lh={1.3} weight={600} tone={sel ? 'ink' : 'muted'}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {p.groups.length === 0 ? (
        <View style={{ marginHorizontal: 20 }}>
          <EmptyState icon="history" title={p.emptyTitle} body={p.emptyBody} />
        </View>
      ) : (
        p.groups.map((g) => (
          <View key={g.key}>
            <View style={{ marginTop: 14, marginBottom: 6, marginHorizontal: 20 }}>
              <Text size={13} lh={1.4} weight={700} tone="muted">
                {g.label}
              </Text>
            </View>
            <View style={{ marginHorizontal: 20, borderRadius: 22, borderWidth: 1, borderColor: c.divider, backgroundColor: c.surface }}>
              {g.rows.map((r, i) => (
                <TransactionRow key={r.id} kind={r.kind} title={r.title} time={r.time} amount={r.amount} divider={i < g.rows.length - 1} />
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

export type { HistoryViewProps, HistoryViewGroup, HistoryViewRow } from './types';
