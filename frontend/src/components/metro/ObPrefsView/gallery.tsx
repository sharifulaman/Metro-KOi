import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { ObPrefsView } from './index';

const noop = () => undefined;

export const gallery: GalleryEntry = {
  name: 'ObPrefsView',
  layer: 'metro',
  variants: [
    {
      label: 'onboarding step 2 of 3',
      render: () => (
        <View style={{ height: 844 }}>
          <ObPrefsView
            title={'আপনার মতো করে\nসাজিয়ে নিন'}
            body="পরে সেটিংস থেকে বদলানো যাবে।"
            lang="bn"
            onLang={noop}
            theme="system"
            onTheme={noop}
            labels={{
              language: 'ভাষা',
              theme: 'থিম',
              bangla: 'বাংলা',
              banglaSub: 'ডিফল্ট',
              english: 'English',
              englishSub: 'ইংরেজি',
              system: 'সিস্টেম',
              light: 'হালকা',
              dark: 'গাঢ়',
              systemNote: 'সিস্টেম মানে ফোনের থিম অনুযায়ী নিজে বদলাবে',
            }}
            nextLabel="পরবর্তী"
            onNext={noop}
            progress={{ index: 1, count: 3 }}
          />
        </View>
      ),
    },
  ],
};
