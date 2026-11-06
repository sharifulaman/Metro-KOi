import { light } from '@/theme/tokens';

import type { GalleryEntry } from '../../galleryTypes';

import { SectionLabel } from './index';

export const gallery: GalleryEntry = {
  name: 'SectionLabel',
  layer: 'ui',
  variants: [
    { label: 'plain', render: () => <SectionLabel text="আজ" /> },
    { label: 'with dot', render: () => <SectionLabel text="প্ল্যাটফর্ম ১ → মতিঝিল" colorDot={light.trainSB} /> },
  ],
};
