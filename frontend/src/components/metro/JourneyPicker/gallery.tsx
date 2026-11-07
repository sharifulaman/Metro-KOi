import type { GalleryEntry } from '../../galleryTypes';

import { JourneyPicker } from './index';

export const gallery: GalleryEntry = {
  name: 'JourneyPicker',
  layer: 'metro',
  variants: [
    {
      label: 'from → to',
      render: () => <JourneyPicker fromCaption="কোথা থেকে" toCaption="কোথায়" fromLabel="ফার্মগেট" toLabel="মতিঝিল" onFrom={() => {}} onTo={() => {}} onSwap={() => {}} swapLabel="অদলবদল" />,
    },
  ],
};
