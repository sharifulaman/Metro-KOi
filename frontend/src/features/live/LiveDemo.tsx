import { useRouter } from 'expo-router';
import { useState } from 'react';

import { LiveView } from '@/components/metro';
import type { LiveStage } from '@/data/demoLive';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtDistance, fmtNum } from '@/lib/fmt';
import { useSettings } from '@/store/settings';

/** Live page with the design's sample trains (artboards ১০ · ১১ · ১২). Shown while "Sample data" is on. */
export function LiveDemo() {
  const { t, lang } = useT();
  const router = useRouter();
  const setLang = useSettings((s) => s.setLang);
  const { byId } = useStations();
  const [stage, setStage] = useState<LiveStage>('overview');

  const nm = (id: string) => (byId[id] ? stationName(byId[id], lang) : id);
  const names = Object.fromEntries(['uttara-north', 'mirpur-10', 'agargaon', 'farmgate', 'motijheel', 'karwan-bazar', 'bijoy-sarani'].map((id) => [id, nm(id)]));
  const live = t('common.live');
  const est = t('common.estimated');
  const min = (n: number) => t('common.minutes', { n: fmtNum(n, lang) });
  const zoom = (z: number, what: string) => t('live.zoomBadge', { z: fmtNum(z, lang), what });

  return (
    <LiveView
      stage={stage}
      onStage={setStage}
      onSearch={() => router.push('/stations')}
      onLang={() => setLang(lang === 'bn' ? 'en' : 'bn')}
      onRide={() => router.push('/rider')}
      onOpen3d={() => router.push('/station/farmgate/3d')}
      onTrainDetail={() => router.push('/train/SB-0630')}
      onGates={() => router.push('/station/farmgate/gates')}
      text={{
        langLabel: lang === 'bn' ? 'বাং · EN' : 'EN · বাং',
        brandSub: t('splash.brandBn'),
        search: t('live.searchLong'),
        counts: t('live.counts', { live: fmtNum(2, lang), est: fmtNum(1, lang) }),
        ride: t('live.ride'),
        credit: t('live.mapCredit'),
        zoom: { overview: zoom(12, t('live.zoomWhole')), city: zoom(14, t('live.zoomCity')), station: zoom(17, t('live.zoomStation')) },
        names,
        tags: {
          live: (id) => id + ' · ' + live,
          estimated: (id) => id + ' · ' + est,
          atStation: (id) => t('live.atStationTag', { id }),
        },
        runningTitle: t('live.runningTitle'),
        trainsCount: fmtNum(t('live.trainsCount', { count: 3 }), lang),
        rows: [
          { id: 'sb', title: t('timetable.SB'), sub: t('live.fromStation', { name: names['karwan-bazar'] }), eta: min(2), live: true, badge: live },
          { id: 'nb', title: t('timetable.NB'), sub: t('live.fromStation', { name: names.farmgate }), eta: min(5), live: false, badge: est },
        ],
        cityPlatform: t('live.platformTo', { n: fmtNum(1, lang), name: names.motijheel }),
        cityTrainId: 'SB-0630',
        cityEta: min(2),
        cityBadge: live,
        cityFrom: names.farmgate,
        cityNext: t('live.nextStationIs', { name: names['karwan-bazar'] }),
        trainDetail: t('train.open'),
        back: t('common.back'),
        stationName: names.farmgate,
        stationSub: (byId.farmgate ? stationAltName(byId.farmgate, lang) : '') + ' · ' + t('common.lineChip'),
        trainAtStation: t('live.trainHere'),
        platformStrong: t('common.platform', { n: fmtNum(1, lang) }),
        platformRest: ' · ' + t('timetable.SB'),
        chips: [
          { label: t('common.lineChip'), tone: 'brand' },
          { label: fmtDistance(220, lang), tone: 'neutral' },
          { label: t('station.gates'), tone: 'neutral' },
        ],
        groups: [
          {
            title: t('live.platformTo', { n: fmtNum(1, lang), name: names.motijheel }),
            rows: [
              { big: t('live.now'), small: t('live.leavesAt', { t: fmtNum('0:13', lang) }), live: true, badge: live },
              { big: '~' + min(9), small: 'SB-0642', live: false, badge: est },
            ],
          },
          { title: t('live.platformTo', { n: fmtNum(2, lang), name: names['uttara-north'] }), rows: [{ big: min(5), small: 'NB-0612', live: false, badge: est }] },
        ],
        open3d: t('live.open3d'),
        gates: t('station.gates'),
      }}
    />
  );
}
