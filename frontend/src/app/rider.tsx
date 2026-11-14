import { useLocalSearchParams, useRouter } from 'expo-router';

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
  const tooFar = useRider((s) => s.tooFar);
  const params = useLocalSearchParams<{ from?: string; to?: string; dir?: string }>();

  if (rider.phase === 'ended') {
    return (
      <Screen gap={5}>
        <Stack flex justify="center" gap={4}>
          <TrainIllustration />
          <EmptyState icon="users" title={t('rider.thanks', { count: fmtNum(rider.session?.helping ?? rider.helping, lang) })} />
          {rider.session?.stopReason === 'refused' ? <InfoNote tone="danger" icon="gpsOff" text={t('rider.refused')} /> : null}
          {rider.session?.stopReason === 'left_corridor' ? <InfoNote icon="gpsOff" text={t('rider.leftRange')} /> : null}
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

  // one page, one confirmation: what we share + the button that starts the ride and opens Journey
  const begin = async () => {
    const ok = await rider.start({ fromStationId: params.from || null, toStationId: params.to || null, direction: params.dir === 'SB' || params.dir === 'NB' ? params.dir : null });
    if (ok) router.replace('/journey');
  };

  return (
    <Screen gap={4} scroll>
      <Stack gap={4}>
        <TrainIllustration />
        <Text variant="display">{t('rider.askTitle')}</Text>
        <Text tone="muted">{t('rider.askBody')}</Text>
        <Card gap={1}>
          <Text variant="title">{t('rider.explainTitle')}</Text>
          <ListRow leading={<IconTile icon="shield" />} title={t('rider.explain1')} />
          <ListRow leading={<IconTile icon="stop" />} title={t('rider.explain2')} />
          <ListRow leading={<IconTile icon="clock" />} title={t('rider.explain3')} />
        </Card>
        {tooFar ? <InfoNote tone="danger" icon="gpsOff" text={t('rider.tooFar')} /> : null}
        {denied ? <InfoNote tone="danger" icon="gpsOff" text={t('rider.denied')} /> : null}
      </Stack>
      <Button fullWidth icon="train" label={t('rider.yes')} onPress={() => void begin()} testID="rider-yes" />
      <Button fullWidth variant="ghost" label={t('rider.notNow')} onPress={() => router.back()} />
    </Screen>
  );
}
