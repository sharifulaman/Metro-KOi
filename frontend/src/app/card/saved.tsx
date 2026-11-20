import { useRouter } from 'expo-router';
import { useState } from 'react';

import { SavedCardsView } from '@/components/metro';
import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';
import { useWallet } from '@/store/wallet';

/** Manage saved cards (design ৭): see each one's balance, set the default, edit or delete it. */
export default function CardSavedScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const cards = useWallet((s) => s.cards);
  const setDefault = useWallet((s) => s.setDefault);
  const remove = useWallet((s) => s.remove);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <SavedCardsView
      title={t('card.savedCardsTitle')}
      backLabel={t('common.back')}
      addLabel={t('card.addCard')}
      cards={cards.map((c) => ({
        id: c.id,
        name: c.name,
        tail: c.tail,
        tailText: '•••• ' + fmtNum(c.tail, lang),
        typeLabel: t('card.' + c.cardType),
        color: c.color,
        rapidPass: c.cardType === 'rapid_pass',
        balance: c.balanceBdt != null ? '৳ ' + fmtNum(c.balanceBdt.toLocaleString('en-US'), lang) : null,
        isDefault: c.isDefault,
        confirming: confirmId === c.id,
      }))}
      defaultLabel={t('card.defaultBadge')}
      noBalanceLabel={t('card.noBalanceShort')}
      editLabel={t('card.edit')}
      deleteLabel={t('card.deleteCard')}
      confirmText={t('card.deleteAsk')}
      note={t('card.localOnlyNote')}
      newCardLabel={t('card.addNewCard')}
      onBack={() => router.back()}
      onAdd={() => router.push('/card/add')}
      onEdit={(id) => router.push('/card/manual?id=' + id)}
      onDelete={(id) => {
        if (confirmId === id) {
          remove(id);
          setConfirmId(null);
        } else {
          setConfirmId(id);
        }
      }}
      onSetDefault={(id) => setDefault(id)}
    />
  );
}
