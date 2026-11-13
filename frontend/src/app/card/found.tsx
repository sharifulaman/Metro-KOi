import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { BalancePanel, CardArt, CardColorPicker } from '@/components/metro';
import { Button, Card, IconTile, Screen, Stack, Text, TextField } from '@/components/ui';
import { useT } from '@/i18n';
import { fmtClock, secOfDayFromMs } from '@/lib/fmt';
import { useCard } from '@/store/card';
import { useWallet } from '@/store/wallet';
import type { CardColor } from '@/theme/tokens';

/** After a successful scan: name the card, pick a colour, save it (or update it if it was saved before). */
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

  const colorLabels = { green: t('card.colorGreen'), dark: t('card.colorDark'), gold: t('card.colorGold'), blue: t('card.colorBlue') };
  const typeLabel = t(`card.${last.cardType}`);
  const chosenName = name.trim() || t('card.defaultCardName');

  const save = () => {
    const w = useWallet.getState();
    if (existing) {
      w.update(existing.id, { name: chosenName, color, tail: last.cardTail, cardType: last.cardType, balanceBdt: last.balanceBdt, lastTapAt: last.lastTapAt, idmHex: last.idmHex, updatedAt: Date.now() });
    } else {
      w.add({ name: chosenName, color, tail: last.cardTail, cardType: last.cardType, source: 'scan', idmHex: last.idmHex, balanceBdt: last.balanceBdt, lastTapAt: last.lastTapAt });
    }
    router.replace('/card');
  };

  return (
    <Screen scroll gap={5}>
      <Card tone="brand" radius="hero" padding={6}>
        <Stack align="center" gap={3}>
          <IconTile icon="check" tone="brand" />
          <Text variant="display" tone="onBrand" align="center">
            {t('card.foundTitle')}
          </Text>
        </Stack>
      </Card>
      <Stack align="center">
        <CardArt name={chosenName} tail={last.cardTail} typeLabel={typeLabel} color={color} />
      </Stack>
      <BalancePanel
        label={t('card.currentBalance')}
        badgeLabel={last.balanceBdt != null ? t('card.readFromCard') : t('card.historyOnly')}
        badgeTone={last.balanceBdt != null ? 'brand' : 'neutral'}
        balanceBdt={last.balanceBdt}
        caption={
          last.balanceBdt != null && last.lastTapAt != null
            ? t('card.lastTapShort', { time: fmtClock(secOfDayFromMs(last.lastTapAt), lang) })
            : last.balanceBdt != null
              ? t('card.cardSource')
              : t('card.noBalanceBody')
        }
        noInfoLabel={t('card.noBalanceInfo')}
      />
      <TextField label={t('card.cardNameLabel')} value={name} onChangeText={setName} maxLength={30} testID="found-name" />
      <Stack gap={2}>
        <Text variant="label" tone="muted" weight={600}>
          {t('card.cardColorLabel')}
        </Text>
        <CardColorPicker value={color} onChange={setColor} labels={colorLabels} />
      </Stack>
      <Stack gap={3}>
        <Button label={existing ? t('card.updateCard') : t('card.save')} fullWidth onPress={save} testID="found-save" />
        <Button label={t('card.scanAgain')} icon="nfc" variant="secondary" fullWidth onPress={() => router.replace('/card/scan')} />
      </Stack>
    </Screen>
  );
}
