import { Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { AddCardSheetProps } from './types';

function Option({ icon, title, badge, body, selected, onPress, testID }: { icon: 'nfc' | 'edit'; title: string; badge?: string; body: string; selected?: boolean; onPress(): void; testID?: string }) {
  const { c } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 20, borderWidth: selected ? 2 : 1.5, borderColor: selected ? c.brand : c.outline, backgroundColor: c.surface, opacity: pressed ? 0.9 : 1 })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={24} color={c.onBrandTint} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text size={16} lh={1.35} weight={700}>
            {title}
          </Text>
          {badge ? <Badge label={badge} tone="brand" /> : null}
        </View>
        <View style={{ marginTop: 2 }}>
          <Text size={13.5} lh={1.45} weight={400} tone="muted">
            {body}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** "Add a card" bottom sheet over a dimmed page (design ৫): scan-to-save or save-by-hand. */
export function AddCardSheet(p: AddCardSheetProps) {
  const { c, shadow } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <View testID={p.testID} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(14,26,22,0.58)' }}>
      <Pressable accessibilityRole="button" accessibilityLabel={p.cancelLabel} onPress={p.onCancel} style={{ flex: 1 }} />
      <View
        style={[
          { minHeight: Math.max(0, height - 372), paddingTop: 12, paddingHorizontal: 24, paddingBottom: 24 + insets.bottom, backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
          shadow.sheet,
        ]}
      >
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.outline, alignSelf: 'center', marginBottom: 16 }} />
        <Text size={22} lh={1.3} weight={700}>
          {p.title}
        </Text>
        <View style={{ marginTop: 2, marginBottom: 14 }}>
          <Text size={14} lh={1.45} weight={400} tone="muted">
            {p.subtitle}
          </Text>
        </View>
        <View style={{ gap: 10 }}>
          <Option icon="nfc" title={p.scanTitle} badge={p.scanBadge} body={p.scanBody} selected onPress={p.onScan} testID="add-scan" />
          <Option icon="edit" title={p.manualTitle} body={p.manualBody} onPress={p.onManual} testID="add-manual" />
        </View>
        <View style={{ marginTop: 16 }}>
          <Button label={p.cancelLabel} variant="secondary" height={48} fullWidth onPress={p.onCancel} />
        </View>
      </View>
    </View>
  );
}

export type { AddCardSheetProps } from './types';
