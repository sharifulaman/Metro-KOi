import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { FoundView } from '@/components/metro';
import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';
import { useCard } from '@/store/card';
import { useWallet } from '@/store/wallet';
import type { CardColor } from '@/theme/tokens';

/** After a successful scan (design ৩ · ৪): name the card, pick a colour, save it (or update it if it was saved before). */
export default function CardFoundScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const last = useCard((s) => s.last);
  const existing = useMemo(() => (last?.idmHex ? useWallet.getState().findByIdm(last.idmHex) : undefined), [last?.idmHex]);

  const [name, setName] = useState(existing?.name ?? t('card.defaultCardName'));
  const [color, setColor] = useState<CardColor>(existing?.color ?? 'green');

  useEffect(() => {
    if (!last) router.replace('/card');
  }, [last, router]);

  if (!last) return null;

  const chosenName = name.trim() || t('card.defaultCardName');
  const save = () => {
    const w = useWallet.getState();
    if (existing) {
      w.update(existing.id, { name: chosenName, color, tail: last.cardTail, cardType: last.cardType, balanceBdt: last.balanceBdt, lastTapAt: last.lastTapAt, idmHex: last.idmHex, updatedAt: Date.now(), sample: false });
    } else {
      w.add({ name: chosenName, color, tail: last.cardTail, cardType: last.cardType, source: 'scan', idmHex: last.idmHex, balanceBdt: last.balanceBdt, lastTapAt: last.lastTapAt });
    }
    router.replace('/card');
  };

  const known = last.balanceBdt != null;
  return (
    <FoundView
      title={t('card.foundTitle')}
      card={{ name: chosenName, tail: fmtNum(last.cardTail, lang), typeLabel: t('card.' + last.cardType), rapidPass: last.cardType === 'rapid_pass' }}
      color={color}
      balanceLabel={t('card.balance')}
      amount={known ? fmtNum((last.balanceBdt as number).toLocaleString('en-US'), lang) : null}
      noInfoTitle={t('card.noBalanceInfo')}
      badgeLabel={known ? t('card.readFromCard') : t('card.historyOnly')}
      badgeTone={known ? 'brand' : 'neutral'}
      nameLabel={t('card.cardNameLabel')}
      name={name}
      onName={setName}
      colorLabel={t('card.cardColorLabel')}
      onColor={setColor}
      colorLabels={{ green: t('card.colorGreen'), dark: t('card.colorDark'), gold: t('card.colorGold'), blue: t('card.colorBlue') }}
      saveLabel={existing ? t('card.updateCard') : t('card.save')}
      onSave={save}
      rescanLabel={t('card.rescan')}
      onRescan={() => router.replace('/card/scan')}
    />
  );
}
