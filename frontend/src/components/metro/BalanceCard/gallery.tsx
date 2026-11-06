import type { GalleryEntry } from '../../galleryTypes';

import { BalanceCard } from './index';

export const gallery: GalleryEntry = {
  name: 'BalanceCard',
  layer: 'metro',
  variants: [
    { label: 'card (sample)', render: () => <BalanceCard balanceBdt={340} lastTap="শেষ ট্যাপ সকাল ৮:৪২" cardTail="কার্ড •••• ৪৮২১" source="card" labels={{ title: 'ব্যালেন্স', unavailable: '—', source: 'নমুনা তথ্য' }} /> },
    { label: 'local, unavailable', render: () => <BalanceCard balanceBdt={null} source="local" labels={{ title: 'Balance', unavailable: 'Balance unavailable', source: 'From trips saved on this phone' }} /> },
  ],
};
