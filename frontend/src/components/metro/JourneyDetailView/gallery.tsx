import type { GalleryEntry } from '../../galleryTypes';

import { JourneyDetailView } from './index';

export const gallery: GalleryEntry = {
  name: 'JourneyDetailView',
  layer: 'metro',
  variants: [
    {
      label: 'live trip',
      render: () => (
        <JourneyDetailView
          title="যাত্রার বিস্তারিত"
          backLabel="পেছনে"
          shareLabel="শেয়ার"
          onBack={() => {}}
          onShare={() => {}}
          route="ফার্মগেট → মতিঝিল"
          badge="live"
          badgeLabel="লাইভ"
          times="৫:৪৮ → ৬:০০"
          meta="১২ মিনিট · ৫টি স্টেশন · SB-0630"
          stops={[
            { key: 'a', name: 'ফার্মগেট', note: 'এখানে উঠবেন · প্ল্যাটফর্ম ১', time: '৫:৪৮', role: 'start' },
            { key: 'b', name: 'কারওয়ান বাজার', time: '৫:৫১', role: 'mid' },
            { key: 'c', name: 'শাহবাগ', time: '৫:৫৪', role: 'mid' },
            { key: 'd', name: 'মতিঝিল', note: 'এখানে নামবেন', time: '৬:০০', role: 'end' },
          ]}
          waitNote="ট্রেন ফার্মগেট স্টেশনে আসতে ~৪ মিনিট"
          action={{ label: 'আমি এই ট্রেনে উঠছি', icon: 'train', onPress: () => {} }}
        />
      ),
    },
  ],
};
