import { useState } from 'react';
import { View } from 'react-native';

import type { LiveStage } from '@/data/demoLive';

import type { GalleryEntry } from '../../galleryTypes';

import { LiveView } from './index';

const text = {
  langLabel: 'EN · বাং',
  brandSub: 'মেট্রো কই?',
  search: 'Find a station or place',
  counts: 'Live 2 · Estimated 1',
  ride: "I'm on the metro",
  credit: '© OpenStreetMap contributors',
  zoom: { overview: 'Zoom 12 · whole line', city: 'Zoom 14 · stations & trains', station: 'Zoom 17 · station detail' },
  names: { farmgate: 'Farmgate', motijheel: 'Motijheel', 'uttara-north': 'Uttara North', 'mirpur-10': 'Mirpur-10', agargaon: 'Agargaon', 'karwan-bazar': 'Karwan Bazar', 'bijoy-sarani': 'Bijoy Sarani' },
  tags: { live: (id: string) => id + ' · Live', estimated: (id: string) => id + ' · Estimated', atStation: (id: string) => id + ' · at the station' },
  runningTitle: 'Line 6 · running now',
  trainsCount: '3 trains',
  rows: [
    { id: 'a', title: 'Towards Motijheel', sub: 'From Karwan Bazar', eta: '2 min', live: true, badge: 'Live' },
    { id: 'b', title: 'Towards Uttara North', sub: 'From Farmgate', eta: '5 min', live: false, badge: 'Estimated' },
  ],
  cityPlatform: 'Platform 1 → Motijheel',
  cityTrainId: 'SB-0630',
  cityEta: '2 min',
  cityBadge: 'Live',
  cityFrom: 'Farmgate',
  cityNext: 'Next station: Karwan Bazar',
  trainDetail: 'Train details',
  back: 'Back',
  stationName: 'Farmgate',
  stationSub: 'ফার্মগেট · MRT Line 6',
  trainAtStation: 'A train is at the station',
  platformStrong: 'Platform 1',
  platformRest: ' · towards Motijheel',
  chips: [{ label: 'MRT Line 6', tone: 'brand' as const }, { label: '220 m away', tone: 'neutral' as const }, { label: 'Gates A B C D', tone: 'neutral' as const }],
  groups: [{ title: 'Platform 1 → Motijheel', rows: [{ big: 'Now', small: 'At the station · leaves 0:13', live: true, badge: 'Live' }] }],
  open3d: 'View station in 3D',
  gates: 'Gates A B C D',
};

function Demo({ start }: { start: LiveStage }) {
  const [stage, setStage] = useState<LiveStage>(start);
  return (
    <View style={{ height: 844, width: 390 }}>
      <LiveView stage={stage} onStage={setStage} text={text} onSearch={() => {}} onLang={() => {}} onRide={() => {}} onOpen3d={() => {}} onTrainDetail={() => {}} onGates={() => {}} />
    </View>
  );
}

export const gallery: GalleryEntry = {
  name: 'LiveView',
  layer: 'metro',
  variants: [
    { label: 'whole line (zoom 12)', render: () => <Demo start="overview" /> },
    { label: 'stations and trains (zoom 14)', render: () => <Demo start="city" /> },
    { label: 'station detail (zoom 17)', render: () => <Demo start="station" /> },
  ],
};
