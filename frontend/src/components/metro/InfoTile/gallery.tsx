import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { InfoTile } from './index';

export const gallery: GalleryEntry = {
  name: 'InfoTile',
  layer: 'metro',
  variants: [
    {
      label: 'three in a row',
      render: () => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <InfoTile icon="gate" value="গেট A B C D" label="৪টি প্রবেশপথ" />
          <InfoTile icon="layers" value="২টি" label="প্ল্যাটফর্ম" />
          <InfoTile icon="locate" value="২২০ মি" label="আপনার থেকে" />
        </View>
      ),
    },
  ],
};
