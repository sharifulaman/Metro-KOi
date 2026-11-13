import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { StationTimelineProps, TimelineEta } from './types';

const ROW = 60;
const LINE_X = 27;

function EtaPill({ eta }: { eta: TimelineEta }) {
  const { c, space } = useTheme();
  const live = eta.kind === 'live';
  return (
    <View style={{ height: 32, paddingHorizontal: space[3], borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: live ? c.liveTint : c.surfaceAlt }}>
      {eta.kind === 'closed' ? (
        <Icon name="clock" size={14} tone="muted" />
      ) : (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: live ? c.live : 'transparent', borderWidth: live ? 0 : 1.6, borderStyle: 'dashed', borderColor: c.inkMuted }} />
      )}
      <Text variant="label" weight={700} tone={live ? 'live' : 'muted'} numeric>
        {eta.label}
      </Text>
    </View>
  );
}

/** The stations list as a vertical line: numbered stops, next-train pills, and the train riding between two stops (design ১৩/১৪). */
export function StationTimeline({ stations, train, labels, testID }: StationTimelineProps) {
  const { c, space, radius, shadow } = useTheme();
  const markerTop = train ? 6 + (train.afterIndex + train.progress) * ROW + ROW / 2 - 11 : null;
  return (
    <View testID={testID} style={[{ backgroundColor: c.surface, borderTopLeftRadius: radius.hero + 2, borderTopRightRadius: radius.hero + 2, paddingTop: 6, overflow: 'hidden' }, shadow.card]}>
      <View style={{ position: 'absolute', left: LINE_X, top: 30, bottom: 30, width: 4, borderRadius: 2, backgroundColor: c.brand, opacity: 0.35 }} />
      {stations.map((s) => {
        const terminal = s.terminal != null;
        return (
          <Pressable
            key={s.id}
            testID={`station-${s.id}`}
            onPress={s.onPress}
            disabled={!s.onPress}
            accessibilityRole={s.onPress ? 'button' : undefined}
            accessibilityLabel={[s.name, s.eta?.label].filter(Boolean).join(', ')}
            style={({ pressed }) => ({ height: ROW, flexDirection: 'row', alignItems: 'center', paddingLeft: 62, paddingRight: space[3], gap: space[2], opacity: pressed ? 0.7 : 1 })}
          >
            <View
              style={{
                position: 'absolute',
                left: 14,
                width: 30,
                height: 30,
                borderRadius: terminal ? 10 : 15,
                backgroundColor: terminal ? c.brandDeep : c.surface,
                borderWidth: 2.5,
                borderColor: c.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="label" weight={700} tone={terminal ? 'onBrand' : 'brand'} numeric>
                {s.order}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
                <Text weight={700} numberOfLines={1}>
                  {s.name}
                </Text>
                {s.terminal ? (
                  <View style={{ paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8, backgroundColor: c.brandTint }}>
                    <Text variant="micro" weight={700} tone="brand">
                      {s.terminal === 'start' ? labels.start : labels.end}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text variant="label" tone="muted" numberOfLines={1}>
                {s.altName}
              </Text>
            </View>
            {s.eta ? <EtaPill eta={s.eta} /> : null}
            <Icon name="chevron" size={18} tone="outline" />
          </Pressable>
        );
      })}
      {train && markerTop != null ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 12,
            top: markerTop,
            width: 34,
            height: 22,
            borderRadius: 11,
            backgroundColor: c.ink,
            borderWidth: 2,
            borderColor: train.live ? c.live : c.estimated,
            borderStyle: train.live ? 'solid' : 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="train" size={13} color={c.inverse} />
        </View>
      ) : null}
    </View>
  );
}

export type { StationTimelineProps, TimelineEta, TimelineStation } from './types';
