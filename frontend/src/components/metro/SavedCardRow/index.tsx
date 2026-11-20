import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Badge } from '../../ui/Badge';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { CardArt } from '../CardArt';

import type { SavedCardRowProps } from './types';

function RoundTool({ icon, label, onPress, danger }: { icon: 'edit' | 'trash'; label: string; onPress(): void; danger?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: danger ? c.dangerTint : c.surfaceAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}
    >
      <Icon name={icon} size={18} color={danger ? c.dangerInk : c.ink} />
    </Pressable>
  );
}

/** One row of the saved-cards list (design ৭): 98×62 card thumbnail, name / •••• tail / balance, edit + delete. */
export function SavedCardRow(p: SavedCardRowProps) {
  const { c } = useTheme();
  return (
    <View testID={p.testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
        <Pressable onPress={p.onPress} disabled={!p.onPress} accessibilityRole="button" accessibilityLabel={p.name}>
          <CardArt name={p.name} tail={p.tail} typeLabel={p.typeLabel} color={p.color} rapidPass={p.rapidPass} size="row" width={98} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text size={15.5} lh={1.35} weight={700} numberOfLines={1}>
            {p.name}
          </Text>
          <Text size={12.5} lh={1.4} weight={400} tone="muted">
            {p.tailText}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
            {p.confirming ? (
              <Text size={13} lh={1.4} weight={600} color={c.dangerInk}>
                {p.confirmText}
              </Text>
            ) : (
              <>
                {p.balance != null ? (
                  <Text size={15} lh={1.35} weight={700}>
                    {p.balance}
                  </Text>
                ) : (
                  <Badge label={p.noBalanceLabel} tone="neutral" />
                )}
                {p.isDefault ? <Badge label={p.defaultLabel} tone="brand" icon="check" /> : null}
              </>
            )}
          </View>
        </View>
        <View style={{ gap: 6 }}>
          <RoundTool icon="edit" label={p.editLabel} onPress={p.onEdit} />
          <RoundTool icon="trash" label={p.deleteLabel} onPress={p.onDelete} danger={p.confirming} />
        </View>
      </View>
      {p.divider ? <View style={{ height: 1, backgroundColor: c.divider, marginHorizontal: 14 }} /> : null}
    </View>
  );
}

export type { SavedCardRowProps } from './types';
