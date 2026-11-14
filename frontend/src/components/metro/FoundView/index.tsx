import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { TextField } from '../../ui/TextField';
import { CardArt } from '../CardArt';
import { CardColorPicker } from '../CardColorPicker';

import type { FoundViewProps } from './types';

// the success band is a fixed dark in both themes (design ৩)
const BAND = '#1C2824';

/** After a good scan (design ৩): dark success band, then a white sheet to name, colour and save the card. */
export function FoundView(p: FoundViewProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const known = p.amount != null;
  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.surface }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 170 + insets.top, backgroundColor: BAND }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 44 + insets.top, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={30} color="#04140E" strokeWidth={2.6} />
        </View>
        <View style={{ marginTop: 8 }}>
          <Text size={20} lh={1.35} weight={700} color="#FFFFFF">
            {p.title}
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: 150 + insets.top, flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ flexGrow: 1, backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 40, boxShadow: '0 -8px 28px rgba(14,26,22,0.12)' }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.outline, alignSelf: 'center', marginBottom: 16 }} />
          <View style={{ alignItems: 'center' }}>
            <CardArt name={p.card.name || ' '} tail={p.card.tail} typeLabel={p.card.typeLabel} color={p.color} width={280} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <View>
              <Text size={13} lh={1.4} weight={400} tone="muted">
                {p.balanceLabel}
              </Text>
              {known ? (
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text size={20} lh={1.2} weight={700} tone="muted">
                    ৳
                  </Text>
                  <Text size={34} lh={1.2} weight={700} numeric>
                    {p.amount}
                  </Text>
                </View>
              ) : (
                <Text size={20} lh={1.35} weight={700}>
                  {p.noInfoTitle}
                </Text>
              )}
            </View>
            <View>
              <Badge label={p.badgeLabel} tone={p.badgeTone} icon={known ? 'nfc' : undefined} />
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <TextField label={p.nameLabel} value={p.name} onChangeText={p.onName} maxLength={30} testID="found-name" />
          </View>
          <View style={{ marginTop: 12 }}>
            <Text size={13} lh={1.4} weight={600} tone="muted">
              {p.colorLabel}
            </Text>
            <View style={{ marginTop: 3 }}>
              <CardColorPicker value={p.color} onChange={p.onColor} labels={p.colorLabels} size={40} ringOn="surface" />
            </View>
          </View>
          <View style={{ marginTop: 11 }}>
            <Button label={p.saveLabel} fullWidth onPress={p.onSave} testID="found-save" />
            <View style={{ marginTop: 8 }}>
              <Button label={p.rescanLabel} icon="nfc" variant="secondary" size="md" fullWidth onPress={p.onRescan} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export type { FoundViewProps } from './types';
