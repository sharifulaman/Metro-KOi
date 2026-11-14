import { ScrollView, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { TextField } from '../../ui/TextField';
import { CardArt } from '../CardArt';
import { CardColorPicker } from '../CardColorPicker';
import { NavHeader } from '../NavHeader';

import type { ManualCardViewProps } from './types';

/** Save a card by hand / edit one (design ৬): live card preview, name, last 4, colour, privacy note, save. */
export function ManualCardView(p: ManualCardViewProps) {
  const { c } = useTheme();
  return (
    <ScrollView testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <NavHeader left={{ icon: 'close', label: p.closeLabel, onPress: p.onClose }} title={p.title} />
      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <CardArt name={p.preview.name} tail={p.preview.tail} typeLabel={p.preview.typeLabel} color={p.color} width={261} />
      </View>
      <View style={{ paddingHorizontal: 24 }}>
        <View style={{ marginTop: 14 }}>
          <TextField label={p.nameLabel} value={p.name} onChangeText={p.onName} maxLength={30} testID="manual-name" />
        </View>
        <View style={{ marginTop: 14 }}>
          <TextField label={p.tailLabel} value={p.tail} onChangeText={p.onTail} keyboardType="numeric" maxLength={4} testID="manual-tail" />
        </View>
        <View style={{ marginTop: 14 }}>
          <Text size={13} lh={1.4} weight={600} tone="muted">
            {p.colorLabel}
          </Text>
          <View style={{ marginTop: 3 }}>
            <CardColorPicker value={p.color} onChange={p.onColor} labels={p.colorLabels} size={38} ringOn="bg" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 9, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, backgroundColor: c.surfaceAlt }}>
          <View style={{ marginTop: 1 }}>
            <Icon name="shieldPlain" size={20} color={c.onBrandTint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text size={13} lh={1.5} weight={400}>
              {p.note}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 16 }}>
          <Button label={p.saveLabel} fullWidth disabled={!p.canSave} onPress={p.onSave} testID="manual-save" />
          {p.scanLabel ? (
            <View style={{ marginTop: 8 }}>
              <Button label={p.scanLabel} icon="nfc" variant="secondary" size="md" fullWidth onPress={p.onScan} />
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

export type { ManualCardViewProps } from './types';
