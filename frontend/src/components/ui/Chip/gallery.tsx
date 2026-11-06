import { light } from '@/theme/tokens';

import type { GalleryEntry } from '../../galleryTypes';
import { Stack } from '../Stack';

import { Chip } from './index';

export const gallery: GalleryEntry = {
  name: 'Chip',
  layer: 'ui',
  variants: [
    {
      label: 'tones',
      render: () => (
        <Stack direction="row" gap={2} wrap>
          <Chip label="এমআরটি লাইন ৬" tone="brand" dot={light.brand} />
          <Chip label="২২০ মি. দূরে" icon="walk" />
          <Chip label="LIVE" tone="live" />
          <Chip label="ink" tone="ink" />
        </Stack>
      ),
    },
    {
      label: 'filter (selected)',
      render: () => (
        <Stack direction="row" gap={2}>
          <Chip label="সব" selected onPress={() => undefined} />
          <Chip label="যাত্রা" onPress={() => undefined} />
          <Chip label="রিচার্জ" onPress={() => undefined} />
        </Stack>
      ),
    },
    { label: 'elevated (map search)', render: () => <Chip label="স্টেশন বা জায়গা" icon="search" elevated onPress={() => undefined} /> },
  ],
};
