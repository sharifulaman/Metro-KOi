import type { GalleryEntry } from '../../galleryTypes';

import { TrainTimeline } from './index';

export const gallery: GalleryEntry = {
  name: 'TrainTimeline',
  layer: 'metro',
  variants: [
    {
      label: 'running, between stops',
      render: () => (
        <TrainTimeline
          direction="SB"
          marker={{ afterIndex: 1, label: 'T-17 এখন এখানে', right: 'আপডেট ৩ সে. আগে' }}
          stops={[
            { key: 'a', label: 'পল্লবী', right: 'সকাল ৭:১৪', rightSub: 'পার হয়েছে', state: 'passed' },
            { key: 'b', label: 'মিরপুর-১১', right: 'সকাল ৭:১৬', rightSub: 'পার হয়েছে', state: 'passed' },
            { key: 'c', label: 'মিরপুর-১০', right: '২ মিনিট', state: 'upcoming' },
            { key: 'd', label: 'কাজীপাড়া', right: '৫ মিনিট', state: 'upcoming' },
            { key: 'e', label: 'ফার্মগেট', right: '১৫ মিনিট', state: 'upcoming', tag: 'আপনার স্টেশন' },
          ]}
        />
      ),
    },
  ],
};
