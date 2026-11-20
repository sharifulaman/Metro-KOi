import { useState } from 'react';

import type { Gate } from '@/models';

import type { GalleryEntry } from '../../galleryTypes';

import { GateCompassView } from './index';

const names: Record<Gate, [string, string]> = {
  A: ['দৈনিক বাংলা মোড় · মতিঝিল থানা', '১০.৯ কি.মি.'],
  B: ['এফবিসিসিআই ভবন · বাংলাদেশ ব্যাংক', '১১.০ কি.মি.'],
  C: ['বিসিআইসি ভবন · সোনালী ব্যাংক', '১১.০ কি.মি.'],
  D: ['বলাকা মোড় · কৃষি ব্যাংক প্রধান কার্যালয়', '১০.৯ কি.মি.'],
};

function Demo({ rotation, arrived, ahead }: { rotation: number | null; arrived: boolean; ahead: boolean }) {
  const [sel, setSel] = useState<Gate>('D');
  return (
    <GateCompassView
      title="গেট ট্র্যাকার"
      subtitle="গেটের দিক ও দূরত্ব"
      onBack={() => undefined}
      backLabel="পেছনে"
      caption={`গেট ${sel} · মতিঝিল`}
      distance={arrived ? 'আপনি এখানে' : names[sel][1] + ' দূরে'}
      status={arrived ? `আপনি গেট ${sel}-এ আছেন` : ahead ? 'সোজা সামনে' : rotation == null ? 'কম্পাস নেই: দূরত্ব দেখুন।' : 'বাঁয়ে ঘুরুন'}
      landmark={names[sel][0]}
      rotation={rotation}
      arrived={arrived}
      ahead={ahead}
      gate={sel}
      rows={(Object.keys(names) as Gate[]).map((g) => ({ gate: g, name: names[g][0], distance: names[g][1], selected: g === sel, onPress: () => setSel(g) }))}
      footnote="গেটের অবস্থান আনুমানিক। স্টেশনের ভেতরের গেট-চিহ্ন দেখে নিশ্চিত হোন।"
    />
  );
}

export const gallery: GalleryEntry = {
  name: 'GateCompassView',
  layer: 'metro',
  variants: [
    { label: 'turn left', render: () => <Demo rotation={-60} arrived={false} ahead={false} /> },
    { label: 'straight ahead', render: () => <Demo rotation={4} arrived={false} ahead /> },
    { label: 'no compass', render: () => <Demo rotation={null} arrived={false} ahead={false} /> },
    { label: 'arrived', render: () => <Demo rotation={0} arrived ahead /> },
  ],
};
