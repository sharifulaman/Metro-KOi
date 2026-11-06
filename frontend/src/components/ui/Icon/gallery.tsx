import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { Icon } from './index';
import type { IconName } from './types';

const names: IconName[] = ['train', 'map', 'list', 'route', 'card', 'more', 'search', 'star', 'gate', 'walk', 'live', 'nfc', 'lift', 'offline'];

export const gallery: GalleryEntry = {
  name: 'Icon',
  layer: 'ui',
  variants: [
    {
      label: 'all tones',
      render: () => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {names.map((n, i) => (
            <Icon key={n} name={n} tone={(['ink', 'muted', 'brand', 'live', 'danger'] as const)[i % 5]} />
          ))}
        </View>
      ),
    },
  ],
};
