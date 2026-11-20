import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { ManualCardView } from '@/components/metro';
import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';
import { useWallet } from '@/store/wallet';
import type { CardColor } from '@/theme/tokens';

/** Save a card by hand (name, colour, last 4 digits), or edit one already saved when `id` is given (design ৬). */
export default function CardManualScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useWallet((s) => (id ? s.cards.find((c) => c.id === id) : undefined));

  const [name, setName] = useState(existing?.name ?? '');
  // the rider may type the card code ("RP…") or just the last 4 digits; only the last 4 digits are ever kept
  const [code, setCode] = useState(existing?.tail ?? '');
  const [color, setColor] = useState<CardColor>(existing?.color ?? 'green');
  const isRp = /^RP/i.test(code);
  const valid = name.trim().length > 0 && /^(RP)?\d{4,}$/i.test(code);
  const tail = code.replace(/\D/g, '').slice(-4);
  const cardType = isRp ? 'rapid_pass' : (existing?.cardType ?? 'mrt_pass');

  const save = () => {
    if (!valid) return;
    const w = useWallet.getState();
    if (existing) {
      w.update(existing.id, { name: name.trim(), tail, color, cardType, sample: false });
    } else {
      w.add({ name: name.trim(), tail, color, cardType, source: 'manual', balanceBdt: null, lastTapAt: null });
    }
    router.replace('/card');
  };

  return (
    <ManualCardView
      title={existing ? t('card.editTitle') : t('card.manualTitle')}
      closeLabel={t('common.close')}
      onClose={() => router.back()}
      preview={{ name: name || t('card.defaultCardName'), tail: tail.length === 4 ? fmtNum(tail, 'en') : '0000', typeLabel: t('card.' + cardType), rapidPass: cardType === 'rapid_pass' }}
      nameLabel={t('card.cardNameLabel')}
      name={name}
      onName={setName}
      tailLabel={t('card.last4Label')}
      tail={code}
      onTail={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
      colorLabel={t('card.cardColorLabel')}
      color={color}
      onColor={setColor}
      colorLabels={{ green: t('card.colorGreen'), dark: t('card.colorDark'), gold: t('card.colorGold'), blue: t('card.colorBlue') }}
      note={t('card.noFullNumberNote')}
      saveLabel={t('card.save')}
      canSave={valid}
      onSave={save}
      scanLabel={existing ? undefined : t('card.scanInsteadCta')}
      onScan={() => router.replace('/card/scan')}
    />
  );
}
