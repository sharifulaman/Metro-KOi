import type { GalleryEntry } from '../../galleryTypes';

import { BrandBar } from './index';

export const gallery: GalleryEntry = {
  name: 'BrandBar',
  layer: 'metro',
  variants: [{ label: 'logo + language toggle', render: () => <BrandBar title="Metro" accent="KOI" subtitle="মেট্রো কই?" langLabel="বাং · EN" /> }],
};
