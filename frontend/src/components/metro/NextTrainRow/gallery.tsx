import type { GalleryEntry } from '../../galleryTypes';

import { NextTrainRow } from './index';

export const gallery: GalleryEntry = {
  name: 'NextTrainRow',
  layer: 'metro',
  variants: [
    { label: 'live', render: () => <NextTrainRow direction="SB" title="মতিঝিলের দিকে" subtitle="প্ল্যাটফর্ম ১" eta="২ মিনিট" source="live" divider /> },
    { label: 'estimated', render: () => <NextTrainRow direction="NB" title="উত্তরার দিকে" subtitle="প্ল্যাটফর্ম ২" eta="~৯ মিনিট" /> },
    { label: 'no train', render: () => <NextTrainRow direction="NB" title="To Uttara North" subtitle="Platform 2" emptyText="No more trains today" /> },
  ],
};
