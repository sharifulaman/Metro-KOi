import type { GalleryEntry } from '../../galleryTypes';
import { Stack } from '../Stack';

import { StatusBadge } from './index';

export const gallery: GalleryEntry = {
  name: 'StatusBadge',
  layer: 'ui',
  variants: [
    {
      label: 'live / estimated / delayed',
      render: () => (
        <Stack direction="row" gap={2}>
          <StatusBadge kind="live" />
          <StatusBadge kind="estimated" />
          <StatusBadge kind="delayed" />
        </Stack>
      ),
    },
  ],
};
