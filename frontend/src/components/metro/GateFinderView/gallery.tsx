import { useState } from 'react';
import { View } from 'react-native';

import type { Gate } from '@/models';

import type { GalleryEntry } from '../../galleryTypes';

import { GateFinderView } from './index';

const gates: { gate: Gate; name: string; area: string }[] = [
  { gate: 'A', name: 'দৈনিক বাংলা মোড়', area: 'মতিঝিল থানা' },
  { gate: 'B', name: 'এফবিসিসিআই ভবন', area: 'বাংলাদেশ ব্যাংক' },
  { gate: 'C', name: 'বিসিআইসি ভবন', area: 'সোনালী ব্যাংক প্রধান কার্যালয়' },
  { gate: 'D', name: 'বলাকা মোড়', area: 'কৃষি ব্যাংক প্রধান কার্যালয়' },
];

function Demo() {
  const [sel, setSel] = useState<Gate>('A');
  return (
    <GateFinderView
      title="গেট খুঁজুন"
      subtitle="কোন গেট দিয়ে বের হবেন, বেছে নিন"
      onBack={() => undefined}
      backLabel="পেছনে"
      stationCaption="কোন স্টেশনে নামছেন"
      stationName="মতিঝিল"
      changeLabel="পরিবর্তন"
      onChangeStation={() => undefined}
      nearestNote="আপনার নিকটতম স্টেশন: ফার্মগেট · ২.৮ কি.মি. দূরে"
      map={<View style={{ flex: 1, backgroundColor: '#DDE7E2' }} />}
      view3d={{ active: false, label: '৩ডি মানচিত্রে যান', onPress: () => undefined }}
      mapNote="গেটের জায়গা অনুমান"
      gates={gates.map((g) => ({ ...g, tag: 'কাছের ও সহজ', selected: g.gate === sel, onPress: () => setSel(g.gate) }))}
      actionLabel={`গেট ${sel} দিয়ে বের হব`}
      onAction={() => undefined}
      footnote="প্রতিটি প্রবেশপথ জরিপ না হওয়া পর্যন্ত গেটের অবস্থান আনুমানিক।"
    />
  );
}

export const gallery: GalleryEntry = {
  name: 'GateFinderView',
  layer: 'metro',
  variants: [{ label: 'step 1: choose the exit gate', render: () => <Demo /> }],
};
