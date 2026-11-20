import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_CONTENT_W, useResponsive } from '@/theme/useResponsive';
import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { EmptyState } from '../EmptyState';
import { JourneyOptionCard } from '../JourneyOptionCard';
import { JourneyPicker } from '../JourneyPicker';

import type { JourneyViewProps } from './types';

/** Journey tab (design ১৬ · ১৮): header, From → To card, Now / Later (or the closed note), fastest card, next trains. */
export function JourneyView(p: JourneyViewProps) {
  const { c, size } = useTheme();
  const { gutter, compact, narrow } = useResponsive();
  const insets = useSafeAreaInsets();
  const m = p.modes;
  const pill = (selected: boolean) => ({ minHeight: 38, paddingVertical: 4, paddingHorizontal: compact ? 14 : 18, borderRadius: 19, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, backgroundColor: selected ? c.brandSolid : c.surface, borderWidth: selected ? 0 : 1.5, borderColor: c.outline });
  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: size.tabBar + insets.bottom + 40, width: '100%', maxWidth: MAX_CONTENT_W, alignSelf: 'center' }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingLeft: gutter + 4, paddingRight: gutter, gap: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text size={narrow ? 26 : 30} lh={1.25} weight={700}>
              {p.title}
            </Text>
            <Text size={14} lh={1.4} tone="muted">
              {p.subtitle}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={p.onTimetable}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 42, paddingHorizontal: Math.max(12, gutter - 4), marginTop: 4, borderRadius: 21, flexShrink: 0, borderWidth: 1.5, borderColor: c.outline, backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 })}
          >
            <Icon name="clock" size={18} color={c.onBrandTint} strokeWidth={2.2} />
            <Text size={14.5} lh={1.3} weight={700} color={c.onBrandTint}>
              {p.timetableLabel}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 14, marginHorizontal: gutter }}>
          <JourneyPicker {...p.picker} />
        </View>

        {p.fare ? (
          <View style={{ marginTop: 14, marginHorizontal: gutter, padding: 14, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexShrink: 1 }}>
                <Text size={12.5} lh={1.4} weight={700} tone="muted">
                  {p.fare.title}
                </Text>
                <Text size={30} lh={1.25} weight={700} numeric>
                  {p.fare.amount}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
                <Text size={12.5} lh={1.4} weight={700} tone="muted" align="right">
                  {p.fare.passLabel}
                </Text>
                <Text size={30} lh={1.25} weight={700} color={c.onBrandTint} numeric>
                  {p.fare.passAmount}
                </Text>
              </View>
            </View>
            {p.fare.note ? (
              <Text size={11.5} lh={1.4} tone="muted">
                {p.fare.note}
              </Text>
            ) : null}
          </View>
        ) : null}

        {p.closedNote ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, marginHorizontal: gutter, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 20, backgroundColor: c.surfaceAlt }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="moon" size={21} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text size={15.5} lh={1.35} weight={700}>
                {p.closedNote.title}
              </Text>
              <Text size={12.5} lh={1.4} tone="muted">
                {p.closedNote.body}
              </Text>
            </View>
          </View>
        ) : m ? (
          <View style={{ marginTop: 14, marginHorizontal: gutter }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: !m.later }} onPress={m.onNow} style={pill(!m.later)}>
                  <Text size={14.5} lh={1.3} weight={700} color={!m.later ? c.onBrandSolid : c.ink}>
                    {m.nowLabel}
                  </Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: m.later }} onPress={m.onLater} style={pill(m.later)}>
                  <Icon name="clock" size={16} color={m.later ? c.onBrandSolid : c.ink} strokeWidth={2.2} />
                  <Text size={14.5} lh={1.3} weight={700} color={m.later ? c.onBrandSolid : c.ink}>
                    {m.laterLabel}
                  </Text>
                </Pressable>
              </View>
              {m.summary ? (
                <View style={{ flex: 1, minWidth: compact ? '100%' : 120 }}>
                  <Text size={12.5} lh={1.4} tone="muted" align={compact ? 'left' : 'right'} numeric numberOfLines={2}>
                    {m.summary}
                  </Text>
                </View>
              ) : null}
            </View>
            {m.later && m.laterOptions.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {m.laterOptions.map((o) => (
                  <Pressable key={o.key} accessibilityRole="button" accessibilityState={{ selected: o.selected }} onPress={o.onPress} style={{ minHeight: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: 'center', backgroundColor: o.selected ? c.ink : c.surfaceAlt }}>
                    <Text size={13.5} lh={1.3} weight={600} color={o.selected ? c.surface : c.ink}>
                      {o.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {p.empty ? (
          <View style={{ marginTop: 16, marginHorizontal: gutter }}>
            <EmptyState compact icon={p.empty.icon} title={p.empty.title} action={p.empty.action} />
          </View>
        ) : null}

        {p.best ? (
          <View style={{ marginTop: 14, marginHorizontal: gutter }}>
            <JourneyOptionCard {...p.best} best />
          </View>
        ) : null}

        {p.rows.length > 0 ? (
          <View style={{ marginTop: 18, marginHorizontal: gutter }}>
            {p.listTitle ? (
              <View style={{ marginHorizontal: 4, marginBottom: 8 }}>
                <Text size={14} lh={1.4} weight={700} tone="muted">
                  {p.listTitle}
                </Text>
              </View>
            ) : null}
            <View style={{ borderRadius: 22, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline, overflow: 'hidden' }}>
              {p.rows.map((r, i) => (
                <View key={r.depart + i} style={i > 0 ? { borderTopWidth: 1, borderTopColor: c.outline } : undefined}>
                  <JourneyOptionCard {...r} best={false} />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {p.footer ? <View style={{ marginTop: 22, marginHorizontal: gutter }}>{p.footer}</View> : null}

        <View style={{ marginTop: 18, marginHorizontal: 24 }}>
          <Text size={11.5} lh={1.4} tone="muted">
            {p.disclaimer}
          </Text>
        </View>
      </ScrollView>
      {p.children}
    </View>
  );
}

export type { JourneyViewProps } from './types';
