import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { JourneyDetailViewProps } from './types';

const ROW = 62;

/** Journey details (design ১৭): green summary card, every stop of the trip on a rail, and the boarding action. */
export function JourneyDetailView(p: JourneyDetailViewProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const round = { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: c.outline, backgroundColor: c.surface, alignItems: 'center' as const, justifyContent: 'center' as const };
  const n = p.stops.length;
  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={p.backLabel} onPress={p.onBack} style={round}>
            <Icon name="back" size={22} />
          </Pressable>
          <Text size={18} lh={1.35} weight={700}>
            {p.title}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={p.shareLabel} onPress={p.onShare} style={round}>
            <Icon name="share" size={20} />
          </Pressable>
        </View>

        <View style={{ marginTop: 16, marginHorizontal: 20, padding: 16, borderRadius: 24, backgroundColor: c.brandSolid }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text size={13} lh={1.4} weight={600} color={c.onBrandSolid} numberOfLines={1}>
              {p.route}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' }}>
              {p.badge === 'schedule' ? <Icon name="clock" size={13} color={c.onBrandSolid} strokeWidth={2.2} /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.badge === 'live' ? '#FBBF24' : 'transparent', borderWidth: p.badge === 'live' ? 0 : 1.6, borderStyle: 'dashed', borderColor: c.onBrandSolid }} />}
              <Text size={12.5} lh={1.4} weight={700} color={c.onBrandSolid}>
                {p.badgeLabel}
              </Text>
            </View>
          </View>
          <Text size={34} lh={1.2} weight={700} tracking={-0.5} color={c.onBrandSolid} numeric>
            {p.times}
          </Text>
          <Text size={13} lh={1.4} color={c.onBrandSolid} numeric>
            {p.meta}
          </Text>
        </View>

        <View style={{ marginTop: 16, marginHorizontal: 20, paddingVertical: 6, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline }}>
          <View>
            <View style={{ position: 'absolute', left: 29, top: ROW / 2, height: (n - 1) * ROW, width: 3, borderRadius: 2, backgroundColor: c.brand, opacity: 0.4 }} />
            {p.stops.map((s) => {
              const end = s.role !== 'mid';
              return (
                <View key={s.key} style={{ height: ROW, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 58, paddingRight: 18 }}>
                  <View style={{ position: 'absolute', left: 21, top: 22, width: 18, height: 18, borderRadius: s.role === 'end' ? 6 : 9, backgroundColor: end ? c.brand : c.surface, borderWidth: 3, borderColor: c.brand }} />
                  <View style={{ flex: 1 }}>
                    <Text size={end ? 17 : 16} lh={1.35} weight={end ? 700 : 600} numberOfLines={1}>
                      {s.name}
                    </Text>
                    {s.note ? (
                      <Text size={12.5} lh={1.35} weight={600} color={c.brandSolid}>
                        {s.note}
                      </Text>
                    ) : null}
                  </View>
                  <Text size={end ? 17 : 15.5} lh={1.3} weight={700} tone={end ? 'ink' : 'muted'} numeric>
                    {s.time}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 16, gap: 8 }}>
        {p.waitNote ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
            <Icon name="clock" size={15} color={c.inkMuted} strokeWidth={2.2} />
            <Text size={12.5} lh={1.4} tone="muted">
              {p.waitNote}
            </Text>
          </View>
        ) : null}
        <Button label={p.action.label} icon={p.action.icon} fullWidth height={52} onPress={p.action.onPress} />
      </View>
    </View>
  );
}

export type { JourneyDetailViewProps, JourneyDetailStop } from './types';
