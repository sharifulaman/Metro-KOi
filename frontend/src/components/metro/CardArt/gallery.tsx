import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { CardArt } from './index';

export const gallery: GalleryEntry = {
  name: 'CardArt',
  layer: 'metro',
  variants: [
    {
      label: 'hero, all colours',
      render: () => (
        <View style={{ gap: 12 }}>
          <CardArt name="My metro card" tail="4821" typeLabel="Rapid Pass" color="green" />
          <CardArt name="Office card" tail="1709" typeLabel="Rapid Pass" color="gold" />
          <CardArt name="Dad's card" tail="9302" typeLabel="MRT Pass" color="dark" />
          <CardArt name="Spare" tail="5560" typeLabel="Rapid Pass" color="blue" />
        </View>
      ),
    },
    {
      label: 'row thumbnail (list rows)',
      render: () => (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <CardArt name="My metro card" tail="4821" typeLabel="Rapid Pass" color="green" size="row" />
          <CardArt name="Office card" tail="1709" typeLabel="Rapid Pass" color="gold" size="row" />
        </View>
      ),
    },
  ],
};
