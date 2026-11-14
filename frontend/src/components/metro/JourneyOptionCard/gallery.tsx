import type { GalleryEntry } from '../../galleryTypes';

import { JourneyOptionCard } from './index';

export const gallery: GalleryEntry = {
  name: 'JourneyOptionCard',
  layer: 'metro',
  variants: [
    {
      label: 'best (live)',
      render: () => (
        <JourneyOptionCard
          best
          bestLabel="সবচেয়ে দ্রুত"
          badge="live"
          badgeLabel="লাইভ"
          departCaption="ছাড়বে"
          arriveCaption="পৌঁছাবে"
          depart="৫:৪৮"
          arrive="৬:০০"
          waitText="৪ মিনিট পরে"
          arriveText="৫টি স্টেশন"
          duration="১২ মিনিট"
          midStops={4}
          platformText="প্ল্যাটফর্ম ১ · মতিঝিলের দিকে"
          platformMeta="SB-0630"
          action={{ label: 'ট্রেন ট্র্যাক করুন', icon: 'pin', onPress: () => {} }}
          share={{ label: 'শেয়ার', onPress: () => {} }}
        />
      ),
    },
    { label: 'compact (estimated)', render: () => <JourneyOptionCard badge="estimated" badgeLabel="আনুমানিক" depart="৫:৫৮" arrive="৬:১০" waitText="১৪ মিনিট পরে" /> },
    { label: 'compact (timetable)', render: () => <JourneyOptionCard badge="schedule" badgeLabel="সময়সূচি" depart="৭:১৫" arrive="৭:২৮" waitText="কাল সকাল" /> },
  ],
};
