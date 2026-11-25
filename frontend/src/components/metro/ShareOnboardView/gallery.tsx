import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { ShareOnboardView } from './index';

const noop = () => undefined;

export const gallery: GalleryEntry = {
  name: 'ShareOnboardView',
  layer: 'metro',
  variants: [
    {
      label: 'onboarding step 2 of 3',
      render: () => (
        <View style={{ height: 844 }}>
          <ShareOnboardView
            title={'যাত্রা শেয়ার করে\nঅন্যদের সাহায্য করুন'}
            body="আপনার ট্রেন কোথায়, সেটা জানলে বাকিরা ট্রেনের আসল সময় পায়।"
            rows={[
              { icon: 'shield', title: 'নাম-পরিচয় ছাড়া', body: 'কে যাচ্ছেন, কিছুই জানানো হয় না' },
              { icon: 'clock', title: 'শুধু যাত্রার সময়', body: 'কোন ট্রেন, কোন স্টেশন আর কখন' },
              { icon: 'lock', title: '২৪ ঘণ্টায় মুছে যায়', body: 'যাত্রার লোকেশন ২৪ ঘণ্টা পর মুছে ফেলা হয়' },
            ]}
            trainLabel="আপনার ট্রেন"
            liveLabel="সবার জন্য লাইভ"
            ctaLabel="শেয়ার চালু করুন"
            note="চালু করার আগে কিছুই শেয়ার হয় না। সেটিংস থেকে যখন খুশি বন্ধ করা যায়"
            skipLabel="এখন না"
            onEnable={noop}
            onSkip={noop}
            progress={{ index: 1, count: 3 }}
          />
        </View>
      ),
    },
  ],
};
