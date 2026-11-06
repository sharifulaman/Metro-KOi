import type { GalleryEntry } from '../../galleryTypes';

import { CoachCrowdBar } from './index';

export const gallery: GalleryEntry = {
  name: 'CoachCrowdBar',
  layer: 'metro',
  variants: [
    { label: 'sample + legend', render: () => <CoachCrowdBar values={[82, 64, 35, 20, 48, 90]} showLegend legend={{ low: 'কম', mid: 'মাঝারি', high: 'ভিড়' }} /> },
  ],
};
