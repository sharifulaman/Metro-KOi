import { View } from 'react-native';

import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';
import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';

import { crowdLevel, type CoachCrowdBarProps } from './types';

export function CoachCrowdBar({ values, showLegend, legend, testID }: CoachCrowdBarProps) {
  const { c, space, radius } = useTheme();
  const { lang } = useT();
  const color = { low: c.crowdLow, mid: c.crowdMid, high: c.crowdHigh };
  return (
    <View testID={testID} style={{ gap: space[2] }}>
      <View style={{ flexDirection: 'row', gap: space[1], alignItems: 'flex-end', height: 40 }}>
        {values.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 2 }} accessibilityLabel={`Coach ${i + 1}: ${v}%`}>
            <View style={{ width: '100%', height: 28, borderRadius: radius.tile / 2, backgroundColor: c.surfaceAlt, justifyContent: 'flex-end', overflow: 'hidden' }}>
              <View style={{ height: `${Math.max(8, Math.min(100, v))}%`, backgroundColor: color[crowdLevel(v)] }} />
            </View>
            <Text variant="micro" tone="muted" numeric>
              {fmtNum(i + 1, lang)}
            </Text>
          </View>
        ))}
      </View>
      {showLegend && legend ? (
        <View style={{ flexDirection: 'row', gap: space[3] }}>
          {(['low', 'mid', 'high'] as const).map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: space[1] }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color[k] }} />
              <Text variant="micro" tone="muted">
                {legend[k]}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export type { CoachCrowdBarProps } from './types';
export { crowdLevel } from './types';
