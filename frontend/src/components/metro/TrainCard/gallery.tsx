import type { GalleryEntry } from '../../galleryTypes';

import { TrainCard } from './index';

const labels = { atStation: 'স্টেশনে আছে', departed: 'ছেড়ে গেছে', emptiest: 'সবচেয়ে খালি কোচ: ৪', legend: { low: 'কম', mid: 'মাঝারি', high: 'ভিড়' } };

export const gallery: GalleryEntry = {
  name: 'TrainCard',
  layer: 'metro',
  variants: [
    { label: 'compact (station sheet)', render: () => <TrainCard compact platform={1} title="প্ল্যাটফর্ম ১ → মতিঝিল" eta={{ sec: 120 }} source="live" trainId="T-17" labels={labels} /> },
    { label: 'at station (schedule)', render: () => <TrainCard platform={2} title="Platform 2 → Uttara North" eta={{ state: 'at_station' }} source="schedule" labels={labels} /> },
    {
      label: 'with crowd (sample)',
      render: () => <TrainCard platform={1} title="প্ল্যাটফর্ম ১" eta={{ sec: 300 }} source="live" trainId="T-21" crowd={[82, 64, 35, 20, 48, 90]} emptiestCoach={4} labels={labels} />,
    },
  ],
};
