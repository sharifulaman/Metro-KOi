import type { GalleryEntry } from '../../galleryTypes';

import { JourneyOptionCard } from './index';

export const gallery: GalleryEntry = {
  name: 'JourneyOptionCard',
  layer: 'metro',
  variants: [
    {
      label: 'best (live)',
      render: () => (
        <JourneyOptionCard best bestLabel="সবচেয়ে দ্রুত" depart="২:০৩" arrive="২:১৫" waitText="ছাড়বে · ২ মিনিটে" arriveText="পৌঁছাবে" source="live" footerLeft="প্ল্যাটফর্ম ১ · ট্রেন T-17" footerRight="ভাড়ার তালিকা পাওয়া যায়নি" />
      ),
    },
    { label: 'compact (estimated)', render: () => <JourneyOptionCard depart="২:১১" arrive="২:২৩" waitText="~৮ মিনিটে ছাড়বে" arriveText="→ ২:২৩ পৌঁছাবে" source="schedule" /> },
  ],
};
