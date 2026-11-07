import type { GalleryEntry } from '../../galleryTypes';

import { PlaybackBar } from './index';

const rates = [
  { value: 1, label: '১×' },
  { value: 10, label: '১০×' },
  { value: 60, label: '৬০×' },
];

export const gallery: GalleryEntry = {
  name: 'PlaybackBar',
  layer: 'metro',
  variants: [{ label: '10× playback', render: () => <PlaybackBar title="অফিসিয়াল সময়সূচি অনুযায়ী ট্রেন" timeLabel="সকাল ৭:১২ · শনিবার" rates={rates} rate={10} onRate={() => {}} onClose={() => {}} closeLabel="বন্ধ" /> }],
};
