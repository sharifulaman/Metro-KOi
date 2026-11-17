import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { StatusBadge } from '../../ui/StatusBadge';
import { Text } from '../../ui/Text';

import type { JourneyBadge, JourneyOptionCardProps } from './types';

/** Small grey pill: "Estimated" (dashed dot) or "Timetable" (clock). */
function QuietPill({ kind, label }: { kind: Exclude<JourneyBadge, 'live'>; label: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 12, borderRadius: 16, backgroundColor: c.surfaceAlt }}>
      {kind === 'schedule' ? <Icon name="clock" size={13} color={c.inkMuted} strokeWidth={2.2} /> : <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.6, borderStyle: 'dashed', borderColor: c.inkMuted }} />}
      <Text size={12.5} lh={1.2} weight={700} tone="muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const badgeOf = (badge: JourneyBadge, label: string) => (badge === 'live' ? <StatusBadge kind="live" label={label} /> : <QuietPill kind={badge} label={label} />);

/**
 * One train for a From → To trip (design ১৬ · ১৮). `best`: outlined card with depart ── duration ── arrive,
 * platform strip and actions; otherwise a compact "৫:৫৮ → ৬:১০" row for the list below it.
 */
export function JourneyOptionCard(p: JourneyOptionCardProps) {
  const { c, shadow } = useTheme();
  const a11y = [p.depart, p.arrive, p.waitText].join(', ');
  if (!p.best) {
    return (
      <Pressable
        testID={p.testID}
        disabled={!p.onPress}
        onPress={p.onPress}
        accessibilityRole={p.onPress ? 'button' : undefined}
        accessibilityLabel={a11y}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 60, paddingHorizontal: 14 }}
      >
        <View>
          <Text size={19} lh={1.3} weight={700} numeric>
            {p.depart}
            <Text size={19} lh={1.3} weight={500} color={c.outline}>
              {'  →  '}
            </Text>
            {p.arrive}
          </Text>
          <Text size={12.5} lh={1.35} tone="muted" numeric>
            {p.waitText}
          </Text>
        </View>
        {badgeOf(p.badge, p.badgeLabel)}
      </Pressable>
    );
  }
  const mid = Math.max(0, Math.min(p.midStops ?? 0, 4));
  return (
    <Pressable
      testID={p.testID}
      disabled={!p.onPress}
      onPress={p.onPress}
      // this card holds its own buttons, so it must not be a button itself (a <button> cannot contain a <button>)
      accessibilityLabel={a11y}
      style={[{ paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16, borderRadius: 26, backgroundColor: c.surface, borderWidth: 2, borderColor: c.brand }, shadow.card]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {p.bestLabel ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, backgroundColor: c.brandTint }}>
            <Icon name="star" size={14} color={c.onBrandTint} strokeWidth={2.2} />
            <Text size={12.5} lh={1.4} weight={600} color={c.onBrandTint}>
              {p.bestLabel}
            </Text>
          </View>
        ) : (
          <View />
        )}
        {badgeOf(p.badge, p.badgeLabel)}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
        <View>
          <Text size={12} lh={1.3} tone="muted">
            {p.departCaption ?? ''}
          </Text>
          <Text size={34} lh={1.15} weight={700} tracking={-0.5} numeric>
            {p.depart}
          </Text>
          <Text size={12} lh={1.3} weight={600} color={c.brandSolid}>
            {p.waitText}
          </Text>
        </View>
        <View style={{ flex: 1, height: 24, marginHorizontal: 14 }}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 11, height: 3, borderRadius: 2, backgroundColor: c.brand, opacity: 0.4 }} />
          <View style={{ position: 'absolute', left: -7, top: 5, width: 14, height: 14, borderRadius: 7, backgroundColor: c.brand }} />
          {Array.from({ length: mid }, (_, i) => (
            <View key={i} style={{ position: 'absolute', left: `${((i + 1) / (mid + 1)) * 100}%`, top: 7, width: 10, height: 10, marginLeft: -5, borderRadius: 5, backgroundColor: c.surface, borderWidth: 2.5, borderColor: c.brand }} />
          ))}
          <View style={{ position: 'absolute', right: -7, top: 5, width: 14, height: 14, borderRadius: 4, backgroundColor: c.brand }} />
          {p.duration ? (
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 24, alignItems: 'center' }}>
              <View style={{ height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.brand, justifyContent: 'center' }}>
                <Text size={12.5} lh={1.2} weight={700} color={c.brandSolid} numberOfLines={1} numeric>
                  {p.duration}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text size={12} lh={1.3} tone="muted">
            {p.arriveCaption ?? ''}
          </Text>
          <Text size={34} lh={1.15} weight={700} tracking={-0.5} numeric>
            {p.arrive}
          </Text>
          <Text size={12} lh={1.3} tone="muted">
            {p.arriveText ?? ''}
          </Text>
        </View>
      </View>

      {p.platformText ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: c.surfaceAlt }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Icon name="train" size={16} strokeWidth={2.1} />
            <Text size={13} lh={1.4} weight={600} numberOfLines={1}>
              {p.platformText}
            </Text>
          </View>
          {p.platformMeta ? (
            <Text size={13} lh={1.4} weight={600} tone="muted" numeric numberOfLines={1}>
              {p.platformMeta}
            </Text>
          ) : null}
        </View>
      ) : null}

      {p.action || p.share ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {p.action ? (
            <View style={{ flex: 1 }}>
              <Button label={p.action.label} icon={p.action.icon} fullWidth height={50} onPress={p.action.onPress} />
            </View>
          ) : null}
          {p.share ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={p.share.label}
              onPress={p.share.onPress}
              style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: c.outline, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="share" size={20} strokeWidth={2.1} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {p.extra ? (
        <View style={{ marginTop: 10 }}>
          <Button label={p.extra.label} icon={p.extra.icon} variant="secondary" fullWidth height={50} onPress={p.extra.onPress} />
        </View>
      ) : null}
    </Pressable>
  );
}

export type { JourneyBadge, JourneyOptionCardProps } from './types';
