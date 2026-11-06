import type { GalleryEntry } from '../../galleryTypes';
import { Text } from '../Text';

import { Divider, Spacer } from './index';

export const gallery: GalleryEntry = {
  name: 'Divider / Spacer / Screen',
  layer: 'ui',
  variants: [
    {
      label: 'divider + spacer',
      render: () => (
        <>
          <Text>Above</Text>
          <Spacer size={2} />
          <Divider />
          <Spacer size={2} />
          <Text>Below</Text>
        </>
      ),
    },
  ],
};
