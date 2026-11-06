import { View } from 'react-native';

import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';
import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { RouteStepsProps } from './types';

export function RouteSteps({ steps, estimate, testID }: RouteStepsProps) {
  const { c, space } = useTheme();
  const { lang } = useT();
  return (
    <View testID={testID} style={{ gap: space[1] }}>
      {estimate ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2], paddingBottom: space[2] }}>
          <Icon name="walk" size={16} tone="brand" />
          <Text variant="label" tone="brand" weight={600}>
            {estimate}
          </Text>
        </View>
      ) : null}
      {steps.map((s, i) => (
        <View key={s.n} style={{ flexDirection: 'row', gap: space[3] }} accessibilityLabel={`${s.n}. ${s.text}`}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i === steps.length - 1 ? c.brandDeep : c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="label" weight={700} tone={i === steps.length - 1 ? 'onBrand' : 'brand'} numeric>
                {fmtNum(s.n, lang)}
              </Text>
            </View>
            {i < steps.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 14, backgroundColor: c.divider }} /> : null}
          </View>
          <View style={{ flex: 1, flexDirection: 'row', gap: space[2], paddingTop: 4, paddingBottom: space[3] }}>
            {s.icon ? <Icon name={s.icon} size={16} tone="muted" /> : null}
            <View style={{ flex: 1 }}>
              <Text variant="body">{s.text}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export type { RouteStepItem, RouteStepsProps } from './types';
