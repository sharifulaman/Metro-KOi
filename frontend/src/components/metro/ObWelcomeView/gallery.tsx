import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { ObWelcomeView } from './index';

const noop = () => undefined;

export const gallery: GalleryEntry = {
  name: 'ObWelcomeView',
  layer: 'metro',
  variants: [
    {
      label: 'onboarding step 1 of 3',
      render: () => (
        <View style={{ height: 844 }}>
          <ObWelcomeView
            title={'মেট্রো চলছে,\nলাইভ দেখুন'}
            body="ঢাকার ৩ডি ম্যাপে লাইন ৬-এর ট্রেন কোথায়, এক নজরে।"
            fromLabel="উত্তরা উত্তর"
            toLabel="মতিঝিল"
            etaLabel="৩ মিনিটে আসছে"
            liveLabel="লাইভ"
            nextLabel="পরবর্তী"
            skipLabel="এখন না"
            onNext={noop}
            onSkip={noop}
            progress={{ index: 0, count: 3 }}
          />
        </View>
      ),
    },
  ],
};
