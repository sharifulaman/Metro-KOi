import { useRouter } from 'expo-router';
import { useState } from 'react';

import { EmptyState, LineDiagram, RideBanner, TrainIllustration } from '@/components/metro';
import { Button, Card, InfoNote, ListRow, IconTile, Screen, Stack, Text } from '@/components/ui';
import { useRiderSession } from '@/features/rider/useRiderSession';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';
import { useRider } from '@/store/rider';

/** Share my ride → explainer → active → thanks (spec §10.5, boards 4–5). */
export default function RiderScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const { list } = useStations();
  const rider = useRiderSession();
  const denied = useRider((s) => s.permissionDenied);
  const [explained, setExplained] = useState(false);

  if (rider.phase === 'ended') {
    return (
      <Screen gap={5}>
        <Stack flex justify="center" gap={4}>
          <TrainIllustration />
          <EmptyState icon="users" title={t('rider.thanks', { count: fmtNum(rider.session?.helping ?? rider.helping, lang) })} />
        </Stack>
        <Button
          fullWidth
          label={t('rider.done')}
          onPress={() => {
            useRider.getState().reset();
            router.back();
          }}
        />
      </Screen>
    );
  }

  if (rider.session) {
    return (
      <Screen gap={4}>
        <RideBanner
          title={rider.sharing ? t('rider.sharing') : t('rider.waiting')}
          subtitle={t('rider.helping', { count: fmtNum(rider.helping, lang) })}
          stopLabel={t('common.close')}
          onStop={() => rider.stop('user')}
        />
        <Card padding={4}>
          <LineDiagram orientation="horizontal" stations={list.map((s) => ({ id: s.id, label: stationName(s, lang) }))} />
        </Card>
        <Stack flex />
        <Button fullWidth variant="dangerText" icon="stop" label={t('rider.stop')} onPress={() => rider.stop('user')} testID="rider-stop" />
      </Screen>
    );
  }

  return (
    <Screen gap={4}>
      <Stack flex justify="center" gap={4}>
        <TrainIllustration />
        {!explained ? (
          <>
            <Text variant="display">{t('rider.askTitle')}</Text>
            <Text tone="muted">{t('rider.askBody')}</Text>
          </>
        ) : (
          <Card gap={1}>
            <Text variant="title">{t('rider.explainTitle')}</Text>
            <ListRow leading={<IconTile icon="shield" />} title={t('rider.explain1')} />
            <ListRow leading={<IconTile icon="stop" />} title={t('rider.explain2')} />
            <ListRow leading={<IconTile icon="clock" />} title={t('rider.explain3')} />
          </Card>
        )}
        {denied ? <InfoNote tone="danger" icon="gpsOff" text={t('rider.denied')} /> : null}
      </Stack>
      <Button fullWidth icon="train" label={explained ? t('rider.continue') : t('rider.yes')} onPress={() => (explained ? void rider.start() : setExplained(true))} testID="rider-yes" />
      <Button fullWidth variant="ghost" label={t('rider.notNow')} onPress={() => router.back()} />
    </Screen>
  );
}
