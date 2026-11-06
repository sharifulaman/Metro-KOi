import type { GalleryEntry } from '../../galleryTypes';

import { TrainIllustration } from './index';

export const gallery: GalleryEntry = {
  name: 'TrainIllustration',
  layer: 'metro',
  variants: [
    { label: 'SB, 6 cars', render: () => <TrainIllustration /> },
    { label: 'NB with crowd (sample)', render: () => <TrainIllustration direction="NB" crowd={[82, 64, 35, 20, 48, 90]} /> },
  ],
};
