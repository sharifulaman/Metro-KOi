import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { Badge } from './index';

export const gallery: GalleryEntry = {
  name: 'Badge',
  layer: 'ui',
  variants: [
    {
      label: 'tones',
      render: () => (
        <View style={{ gap: 8 }}>
          <Badge label="Read from card" tone="brand" icon="nfc" />
          <Badge label="History only" tone="neutral" />
          <Badge label="Live" tone="live" />
          <Badge label="Estimated" tone="neutral" dot="estimated" />
          <Badge label="2 min" tone="live" dot="live" />
        </View>
      ),
    },
  ],
};
