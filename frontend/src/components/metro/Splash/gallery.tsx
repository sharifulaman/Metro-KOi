import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { Splash } from './index';

export const gallery: GalleryEntry = {
  name: 'Splash',
  layer: 'metro',
  variants: [
    {
      label: 'opening page (fades out after 2.3 s)',
      render: () => (
        <View style={{ height: 520, overflow: 'hidden', borderRadius: 24 }}>
          <Splash
            title="Metro"
            accent="KOI"
            subtitle="মেট্রো কই?"
            tagline="ঢাকা মেট্রোরেলের লাইভ অবস্থান"
            status="ট্রেনের অবস্থান খোঁজা হচ্ছে…"
            credit={'মানচিত্র © ওপেনস্ট্রিটম্যাপ অবদানকারী\nরাইডারদের শেয়ার করা অবস্থান ও সময়সূচি থেকে'}
            logoLabel="Metro KOI"
            durationMs={60000}
            onFinish={() => undefined}
          />
        </View>
      ),
    },
  ],
};
