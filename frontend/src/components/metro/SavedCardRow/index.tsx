import { Pressable, View } from 'react-native';

import { useT } from '@/i18n';
import { fmtTaka } from '@/lib/fmt';
import { useTheme } from '@/theme/useTheme';

import { Chip } from '../../ui/Chip';
import { IconButton } from '../../ui/IconButton';
import { Text } from '../../ui/Text';
import { CardArt } from '../CardArt';

import type { SavedCardRowProps } from './types';

/** One row in the saved-cards list: the card art, its name/tail/balance, and edit/delete buttons. */
export function SavedCardRow({
  name,
  tail,
  typeLabel,
  color,
  balanceBdt,
  isDefault,
  defaultLabel,
  noBalanceLabel,
  editLabel,
  deleteLabel,
  onPress,
  onEdit,
  onDelete,
  sample,
  sampleLabel,
  divider,
  testID,
}: SavedCardRowProps) {
  const { c, space } = useTheme();
  const { lang } = useT();
  return (
    <View
      testID={testID}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3], borderBottomWidth: divider ? 1 : 0, borderBottomColor: c.divider }}
    >
      <Pressable onPress={onPress} disabled={!onPress} accessibilityRole="button" accessibilityLabel={name} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <CardArt name={name} tail={tail} typeLabel={typeLabel} color={color} size="row" />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text variant="body" weight={700} numberOfLines={1}>
          {name}
        </Text>
        <Text variant="label" tone="muted" numeric>
          {`•••• ${tail}`}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: space[1], columnGap: space[2] }}>
          {balanceBdt != null ? (
            <Text variant="body" weight={700} numeric>
              {fmtTaka(balanceBdt, lang)}
            </Text>
          ) : (
            <Chip label={noBalanceLabel} tone="neutral" />
          )}
          {isDefault ? <Chip label={defaultLabel} tone="brand" icon="check" /> : null}
          {sample && sampleLabel ? <Chip label={sampleLabel} tone="neutral" /> : null}
        </View>
      </View>
      <View style={{ gap: space[1] }}>
        <IconButton icon="edit" onPress={onEdit} accessibilityLabel={editLabel} />
        <IconButton icon="trash" onPress={onDelete} accessibilityLabel={deleteLabel} />
      </View>
    </View>
  );
}

export type { SavedCardRowProps } from './types';
