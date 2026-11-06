import type { GalleryEntry } from '../../galleryTypes';
import { Chip } from '../Chip';

import { Stack } from './index';

export const gallery: GalleryEntry = {
  name: 'Stack',
  layer: 'ui',
  variants: [
    {
      label: 'row gap 2, wrap',
      render: () => (
        <Stack direction="row" gap={2} wrap>
          <Chip label="এক" />
          <Chip label="দুই" />
          <Chip label="তিন" />
        </Stack>
      ),
    },
    {
      label: 'column gap 3',
      render: () => (
        <Stack gap={3}>
          <Chip label="A" />
          <Chip label="B" />
        </Stack>
      ),
    },
  ],
};
