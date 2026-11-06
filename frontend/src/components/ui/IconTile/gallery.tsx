import type { GalleryEntry } from '../../galleryTypes';
import { Stack } from '../Stack';

import { IconTile } from './index';

export const gallery: GalleryEntry = {
  name: 'IconTile',
  layer: 'ui',
  variants: [
    {
      label: 'tones + letter',
      render: () => (
        <Stack direction="row" gap={2}>
          <IconTile icon="train" />
          <IconTile icon="wallet" tone="live" />
          <IconTile icon="info" tone="neutral" />
          <IconTile icon="gate" letter="A" />
        </Stack>
      ),
    },
  ],
};
