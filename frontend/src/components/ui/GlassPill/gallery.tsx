import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { GlassPill } from './index';

export const gallery: GalleryEntry = {
  name: 'GlassPill',
  layer: 'ui',
  variants: [
    {
      label: 'count, zoom badge, status',
      render: () => (
        <View style={{ gap: 10, alignItems: 'flex-start' }}>
          <GlassPill label="Live 2 · Estimated 1" dot="live" />
          <GlassPill label="Zoom 12 · Whole line" icon="layers" size="sm" />
          <GlassPill label="Train at the station" dot="live" size="sm" />
        </View>
      ),
    },
  ],
};
