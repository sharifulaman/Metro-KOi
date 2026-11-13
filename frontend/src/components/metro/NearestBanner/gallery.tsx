import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { NearestBanner } from './index';

export const gallery: GalleryEntry = {
  name: 'NearestBanner',
  layer: 'metro',
  variants: [
    {
      label: 'nearest station / service ended',
      render: () => (
        <View style={{ gap: 10 }}>
          <NearestBanner mode="nearest" caption="আপনার সবচেয়ে কাছের স্টেশন" title="ফার্মগেট" subtitle="২২০ মি · হেঁটে ৩ মিনিট" eta={{ label: '৪ মিনিট', live: true }} />
          <NearestBanner mode="closed" caption="" title="আজকের সার্ভিস শেষ" subtitle="পরের প্রথম ট্রেন কাল সকাল ৬:৩০ · সময়সূচি অনুযায়ী" />
        </View>
      ),
    },
  ],
};
