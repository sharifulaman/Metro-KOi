import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { CardArt, CardColorPicker } from '@/components/metro';
import { Button, InfoNote, Screen, Stack, Text, TextField } from '@/components/ui';
import { useT } from '@/i18n';
import { useWallet } from '@/store/wallet';
import type { CardColor } from '@/theme/tokens';

/** Save a card by hand (name, colour, last 4 digits), or edit one already saved when `id` is given. */
export default function CardManualScreen() {
  const { t } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useWallet((s) => (id ? s.cards.find((c) => c.id === id) : undefined));

  const [name, setName] = useState(existing?.name ?? '');
  const [tail, setTail] = useState(existing?.tail ?? '');
  const [color, setColor] = useState<CardColor>(existing?.color ?? 'green');

  const colorLabels = { green: t('card.colorGreen'), dark: t('card.colorDark'), gold: t('card.colorGold'), blue: t('card.colorBlue') };
  const valid = name.trim().length > 0 && /^\d{4}$/.test(tail);

  const save = () => {
    if (!valid) return;
    const w = useWallet.getState();
    if (existing) {
      w.update(existing.id, { name: name.trim(), tail, color });
    } else {
      w.add({ name: name.trim(), tail, color, cardType: 'rapid_pass', source: 'manual', balanceBdt: null, lastTapAt: null });
    }
    router.replace('/card');
  };

  return (
    <Screen scroll gap={5}>
      <Text variant="display">{existing ? t('card.editTitle') : t('card.manualTitle')}</Text>
      <Stack align="center">
        <CardArt name={name || t('card.defaultCardName')} tail={tail || '0000'} typeLabel={t(`card.${existing?.cardType ?? 'rapid_pass'}`)} color={color} width={261} />
      </Stack>
      <TextField label={t('card.cardNameLabel')} value={name} onChangeText={setName} maxLength={30} testID="manual-name" />
      <TextField label={t('card.last4Label')} value={tail} onChangeText={(v) => setTail(v.replace(/\D/g, '').slice(0, 4))} keyboardType="numeric" maxLength={4} testID="manual-tail" />
      <Stack gap={2}>
        <Text variant="label" tone="muted" weight={600}>
          {t('card.cardColorLabel')}
        </Text>
        <CardColorPicker value={color} onChange={setColor} labels={colorLabels} />
      </Stack>
      <InfoNote icon="lock" text={t('card.noFullNumberNote')} />
      <Stack gap={3}>
        <Button label={t('card.save')} fullWidth disabled={!valid} onPress={save} testID="manual-save" />
        {!existing ? <Button label={t('card.scanInsteadCta')} icon="nfc" variant="secondary" fullWidth onPress={() => router.replace('/card/scan')} /> : null}
      </Stack>
    </Screen>
  );
}
