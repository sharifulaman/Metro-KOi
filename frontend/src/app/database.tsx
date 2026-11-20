import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/metro';
import { Card, IconTile, InfoNote, ListRow, Screen, SectionLabel, Text } from '@/components/ui';
import { useT } from '@/i18n';
import { config } from '@/lib/config';
import { fmtNum } from '@/lib/fmt';
import { zustandStorage } from '@/lib/storage';
import { tileCount } from '@/lib/tileCache';
import { useCard } from '@/store/card';
import { useHistory } from '@/store/history';
import { useSettings } from '@/store/settings';
import { useWallet } from '@/store/wallet';

interface Remote {
  version?: string;
  updatedAt?: string;
  trains: number;
}

const configured = !!config.supabaseUrl && !!config.supabaseAnonKey;

/** Asks Supabase (read-only tables) what it holds right now. */
async function fetchRemote(): Promise<Remote> {
  const headers = { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` };
  const base = `${config.supabaseUrl}/rest/v1`;
  const [tt, tr] = await Promise.all([
    fetch(`${base}/timetable?id=eq.1&select=version,updated_at`, { headers }),
    fetch(`${base}/trains?select=id`, { headers }),
  ]);
  if (!tt.ok) throw new Error('timetable ' + tt.status);
  const row = ((await tt.json()) as { version: string; updated_at: string }[])[0];
  const trains = tr.ok ? ((await tr.json()) as unknown[]).length : 0;
  return { version: row?.version, updatedAt: row?.updated_at, trains };
}

/** Database: which data lives in the cloud (Supabase) and which stays on this phone. */
export default function DatabaseScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const q = useQuery({ queryKey: ['db-info'], queryFn: fetchRemote, enabled: configured, retry: false });
  const trips = useHistory((s) => s.items.length);
  const cards = useWallet((s) => s.cards.length);
  const lastScan = useCard((s) => !!s.last);
  const favourites = useSettings((s) => s.favourites.length);
  let ttCached = false;
  try {
    ttCached = !!zustandStorage('metro-cache').getItem('timetable');
  } catch {
    // storage unavailable
  }

  const status = !configured ? t('db.offline') : q.isPending ? t('db.checking') : q.isError ? t('db.unreachable') : t('db.connected');
  const at = q.data?.updatedAt ? new Date(q.data.updatedAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB') : t('db.unknown');
  const n = (v: number) => fmtNum(v, lang);

  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('db.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      <SectionLabel text={t('db.cloud')} />
      <InfoNote icon="info" tone={configured && q.isSuccess ? 'live' : 'neutral'} text={status} />
      <Card padding={3}>
        <ListRow title={t('db.timetable')} subtitle={t('db.timetableSub', { v: q.data?.version ?? t('db.unknown'), at })} leading={<IconTile icon="calendar" tone="neutral" />} divider />
        <ListRow title={t('db.trains')} subtitle={t('db.trainsSub', { n: q.data ? n(q.data.trains) : t('db.unknown') })} leading={<IconTile icon="train" tone="neutral" />} divider />
        <ListRow title={t('db.events')} subtitle={t('db.eventsSub')} leading={<IconTile icon="locate" tone="neutral" />} divider />
        <ListRow title={t('db.fusion')} subtitle={t('db.fusionSub')} leading={<IconTile icon="shield" tone="neutral" />} />
      </Card>
      <SectionLabel text={t('db.phone')} />
      <Card padding={3}>
        <ListRow title={t('db.settings')} subtitle={`${t('db.settingsSub')} (${n(favourites)})`} leading={<IconTile icon="layers" tone="neutral" />} divider />
        <ListRow title={t('db.history')} subtitle={t('db.historySub', { n: n(trips) })} leading={<IconTile icon="clock" tone="neutral" />} divider />
        <ListRow title={t('db.cards')} subtitle={t('db.cardsSub', { n: n(cards) })} leading={<IconTile icon="info" tone="neutral" />} divider />
        <ListRow title={t('db.lastScan')} subtitle={`${t('db.lastScanSub')} · ${lastScan ? t('db.yes') : t('db.no')}`} leading={<IconTile icon="info" tone="neutral" />} divider />
        <ListRow title={t('db.ttCache')} subtitle={ttCached ? t('db.ttCacheYes') : t('db.ttCacheNo')} leading={<IconTile icon="calendar" tone="neutral" />} divider />
        <ListRow title={t('db.tiles')} subtitle={t('db.tilesSub', { n: n(tileCount()) })} leading={<IconTile icon="map" tone="neutral" />} />
      </Card>
      <Text variant="label" tone="muted">{t('app.unofficial')}</Text>
    </Screen>
  );
}
