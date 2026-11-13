import { Stack } from '../../ui/Stack';
import type { GalleryEntry } from '../../galleryTypes';

import { BrandMark } from './index';

export const gallery: GalleryEntry = {
  name: 'BrandMark',
  layer: 'metro',
  variants: [
    {
      label: 'tile (header) / pin (splash)',
      render: () => (
        <Stack direction="row" gap={4}>
          <BrandMark size={48} />
          <BrandMark variant="pin" size={72} />
        </Stack>
      ),
    },
  ],
};
