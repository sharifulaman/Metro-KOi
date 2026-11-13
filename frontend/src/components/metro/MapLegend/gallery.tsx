import type { GalleryEntry } from '../../galleryTypes';

import { MapLegend } from './index';

export const gallery: GalleryEntry = {
  name: 'MapLegend',
  layer: 'metro',
  variants: [
    {
      label: 'train outlines',
      render: () => (
        <MapLegend
          items={[
            { kind: 'live', label: 'চলছে (লাইভ)' },
            { kind: 'dwell', label: 'স্টেশনে, ছাড়ার টাইমার' },
            { kind: 'estimated', label: 'আনুমানিক' },
          ]}
        />
      ),
    },
  ],
};
