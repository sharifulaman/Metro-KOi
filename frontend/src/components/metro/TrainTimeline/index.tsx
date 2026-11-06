import { Fragment } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Chip } from '../../ui/Chip';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { TrainTimelineProps } from './types';

const RAIL = 28;

/**
 * Station-by-station run of one train (board 3): passed stops greyed, a
 * "train is here" marker between two stops, upcoming stops with their times.
 */
export function TrainTimeline({ stops, direction, marker, testID }: TrainTimelineProps) {
  const { c, space, size } = useTheme();
  const color = direction === 'SB' ? c.trainSB : c.trainNB;
  const last = stops.length - 1;

  const markerRow = marker ? (
    <View key="marker" style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: space[3] }}>
      <View style={{ width: RAIL, alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, width: 4, backgroundColor: color }} />
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color, borderWidth: 3, borderColor: c.liveTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="train" size={14} color={c.onBrand} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="label" weight={700} tone="brand" numberOfLines={1}>
          {marker.label}
        </Text>
      </View>
      {marker.right ? (
        <Text variant="micro" tone="muted" numeric>
          {marker.right}
        </Text>
      ) : null}
    </View>
  ) : null;

  return (
    <View testID={testID}>
      {marker?.afterIndex === -1 ? markerRow : null}
      {stops.map((s, i) => {
        const passed = s.state === 'passed';
        // rail above/below each dot: grey once the train has gone by
        const aboveColor = i === 0 ? 'transparent' : passed ? c.outline : color;
        const belowColor = i === last ? 'transparent' : passed && marker?.afterIndex !== i ? c.outline : color;
        return (
          <Fragment key={s.key}>
            <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: size.row - 8, gap: space[3] }}>
              <View style={{ width: RAIL, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'absolute', top: 0, height: '50%', width: 4, backgroundColor: aboveColor }} />
                <View style={{ position: 'absolute', bottom: 0, height: '50%', width: 4, backgroundColor: belowColor }} />
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: passed ? c.outline : s.tag ? color : c.surface,
                    borderWidth: 3,
                    borderColor: passed ? c.outline : color,
                  }}
                />
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
                <Text weight={passed ? 400 : 600} tone={passed ? 'muted' : 'ink'} numberOfLines={1}>
                  {s.label}
                </Text>
                {s.tag ? <Chip label={s.tag} tone="brand" /> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {s.right ? (
                  <Text variant="label" weight={passed ? 400 : 700} tone={passed ? 'muted' : 'ink'} numeric>
                    {s.right}
                  </Text>
                ) : null}
                {s.rightSub ? (
                  <Text variant="micro" tone="muted">
                    {s.rightSub}
                  </Text>
                ) : null}
              </View>
            </View>
            {marker?.afterIndex === i ? markerRow : null}
          </Fragment>
        );
      })}
    </View>
  );
}

export type { TimelineStop, TrainTimelineProps } from './types';
