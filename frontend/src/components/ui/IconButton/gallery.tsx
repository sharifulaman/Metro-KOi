import type { GalleryEntry } from '../../galleryTypes';
import { Stack } from '../Stack';

import { IconButton } from './index';

export const gallery: GalleryEntry = {
  name: 'IconButton',
  layer: 'ui',
  variants: [
    {
      label: 'back / favourite / locate',
      render: () => (
        <Stack direction="row" gap={3}>
          <IconButton icon="back" accessibilityLabel="Back" />
          <IconButton icon="star" active accessibilityLabel="Favourite" />
          <IconButton icon="locate" elevated accessibilityLabel="Locate me" />
        </Stack>
      ),
    },
  ],
};
