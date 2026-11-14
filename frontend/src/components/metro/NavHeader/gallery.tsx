import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { NavHeader } from './index';

export const gallery: GalleryEntry = {
  name: 'NavHeader',
  layer: 'metro',
  variants: [
    {
      label: 'back + add',
      render: () => (
        <View style={{ width: 390 }}>
          <NavHeader left={{ icon: 'back', label: 'Back', onPress: () => {} }} title="Saved cards" right={{ icon: 'add', label: 'Add', onPress: () => {} }} />
        </View>
      ),
    },
    {
      label: 'close',
      render: () => (
        <View style={{ width: 390 }}>
          <NavHeader left={{ icon: 'close', label: 'Close', onPress: () => {} }} title="Scan card" />
        </View>
      ),
    },
  ],
};
