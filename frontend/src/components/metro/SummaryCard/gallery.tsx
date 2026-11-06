import type { GalleryEntry } from '../../galleryTypes';

import { SummaryCard } from './index';

export const gallery: GalleryEntry = {
  name: 'SummaryCard',
  layer: 'metro',
  variants: [{ label: 'month', render: () => <SummaryCard title="নভেম্বর" stats={[{ label: 'এ মাসের যাত্রা', value: '২৪' }, { label: 'এ মাসের খরচ', value: '৳৭২০' }]} /> }],
};
