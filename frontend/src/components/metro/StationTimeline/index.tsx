import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { StationTimelineProps, TimelineEta } from './types';

const ROW = 60;
const LINE_X = 27;

function EtaPill({ eta }: { eta: TimelineEta }) {
  const { c } = useTheme();
  const live = eta.kind === 'live';
  return (
    <View style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: live ? c.liveTint : c.surfaceAlt }}>
      {eta.kind === 'closed' ? (
        <Icon name="clock" size={16} color={c.inkMuted} strokeWidth={2.2} />
      ) : (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: live ? c.live : 'transparent', borderWidth: live ? 0 : 1.6, borderStyle: 'dashed', borderColor: c.inkMuted }} />
      )}
      <Text size={14} lh={1} weight={700} color={live ? c.onLiveTint : c.inkMuted} numeric>
        {eta.label}
      </Text>
    </View>
  );
}

/** The stations list as a vertical line: numbered stops, next-train pills, and the train riding between two stops (design ১৩/১৪). */
export function StationTimeline({ stations, train, labels, testID }: StationTimelineProps) {
  const { c, dark } = useTheme();
  const markerTop = train ? 6 + (train.afterIndex + train.progress) * ROW + ROW / 2 - 11 : null;
  return (
    <View testID={testID} style={{ backgroundColor: c.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 6, overflow: 'hidden', boxShadow: '0 1px 0 ' + c.divider }}>
      <View style={{ position: 'absolute', left: LINE_X, top: 36, bottom: 30, width: 4, borderRadius: 2, backgroundColor: c.brand, opacity: 0.35 }} />
      {stations.map((s) => {
        const terminal = s.terminal != null;
        return (
          <Pressable
            key={s.id}
            testID={'station-' + s.id}
            onPress={s.onPress}
            disabled={!s.onPress}
            accessibilityRole={s.onPress ? 'button' : undefined}
            accessibilityLabel={[s.name, s.eta?.label].filter(Boolean).join(', ')}
            style={({ pressed }) => ({ height: ROW, flexDirection: 'row', alignItems: 'center', paddingLeft: 62, paddingRight: 14, opacity: pressed ? 0.7 : 1 })}
          >
            <View
              style={{
                position: 'absolute',
                left: 14,
                top: 15,
                width: 30,
                height: 30,
                borderRadius: terminal ? 10 : 15,
                backgroundColor: terminal ? c.brandSolid : c.surface,
                borderWidth: 2.5,
                borderColor: c.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size={13} lh={1} weight={700} color={terminal ? c.onBrandSolid : c.onBrandTint} numeric>
                {s.order}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text size={16.5} lh={1.3} weight={700} numberOfLines={1}>
                  {s.name}
                </Text>
                {s.terminal ? (
                  <View style={{ marginLeft: 8, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8, backgroundColor: c.brandTint }}>
                    <Text size={11} lh={1.3} weight={700} color={c.onBrandTint}>
                      {s.terminal === 'start' ? labels.start : labels.end}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text size={12.5} lh={1.35} weight={400} tone="muted" numberOfLines={1}>
                {s.altName}
              </Text>
            </View>
            {s.eta ? <EtaPill eta={s.eta} /> : null}
            <View style={{ marginLeft: 6 }}>
              <Icon name="chevron" size={18} color={dark ? '#5E716A' : '#9FB0A8'} strokeWidth={2.2} />
            </View>
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
            backgroundColor: '#0B0F0E',
            borderWidth: 2,
            borderColor: train.live ? c.live : c.estimated,
            borderStyle: train.live ? 'solid' : 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="train" size={13} color="#FFFFFF" strokeWidth={2.4} />
        </View>
      ) : null}
    </View>
  );
}

export type { StationTimelineProps, TimelineEta, TimelineStation } from './types';
