import type { GalleryEntry } from '../../galleryTypes';

import { RouteSteps } from './index';

export const gallery: GalleryEntry = {
  name: 'RouteSteps',
  layer: 'metro',
  variants: [
    {
      label: 'entry route',
      render: () => (
        <RouteSteps
          estimate="হাঁটার সময় এখনও মাপা হয়নি"
          steps={[
            { n: 1, text: 'গেট A দিয়ে ঢুকুন', icon: 'gate' },
            { n: 2, text: 'সিঁড়ি বা লিফটে কনকোর্সে উঠুন', icon: 'lift' },
            { n: 3, text: 'টিকিট গেটে কার্ড ছোঁয়ান', icon: 'card' },
            { n: 4, text: 'প্ল্যাটফর্ম ১, মতিঝিলের দিকে', icon: 'train' },
          ]}
        />
      ),
    },
  ],
};
