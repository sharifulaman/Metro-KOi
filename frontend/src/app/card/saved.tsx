import { useRouter } from 'expo-router';
import { useState } from 'react';

import { SavedCardRow, ScreenHeader } from '@/components/metro';
import { Button, InfoNote, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { useWallet } from '@/store/wallet';

/** Manage saved cards: see each one's balance, set the default, edit or delete it. */
export default function CardSavedScreen() {
  const { t } = useT();
  const router = useRouter();
  const cards = useWallet((s) => s.cards);
  const setDefault = useWallet((s) => s.setDefault);
  const remove = useWallet((s) => s.remove);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('card.savedCardsTitle')} onBack={() => router.back()} backLabel={t('common.back')} />
      {cards.map((c, i) =>
        confirmId === c.id ? (
          <Button
            key={c.id}
            label={t('card.deleteConfirm')}
            variant="dangerText"
            icon="trash"
            onPress={() => {
              remove(c.id);
              setConfirmId(null);
            }}
            testID={`saved-confirm-${c.id}`}
          />
        ) : (
          <SavedCardRow
            key={c.id}
            name={c.name}
            tail={c.tail}
            typeLabel={t(`card.${c.cardType}`)}
            color={c.color}
            balanceBdt={c.balanceBdt}
            isDefault={c.isDefault}
            defaultLabel={t('card.defaultBadge')}
            noBalanceLabel={t('card.noBalanceShort')}
            editLabel={t('card.edit')}
            deleteLabel={t('card.deleteCard')}
            onPress={() => setDefault(c.id)}
            onEdit={() => router.push(`/card/manual?id=${c.id}`)}
            onDelete={() => setConfirmId(c.id)}
            sample={c.sample}
            sampleLabel={t('common.sample')}
            divider={i < cards.length - 1}
            testID={`saved-row-${c.id}`}
          />
        ),
      )}
      <InfoNote icon="lock" text={t('card.localOnlyNote')} />
      <Button label={t('card.addNewCard')} icon="add" fullWidth onPress={() => router.push('/card/add')} />
    </Screen>
  );
}
