import type { GalleryEntry } from '../../galleryTypes';
import { Stack } from '../../ui/Stack';

import { ConnectionPill } from './index';

export const gallery: GalleryEntry = {
  name: 'ConnectionPill',
  layer: 'metro',
  variants: [
    {
      label: 'states',
      render: () => (
        <Stack gap={2}>
          <ConnectionPill state="live" label="লাইভ" />
          <ConnectionPill state="reconnecting" label="আবার যুক্ত হচ্ছে…" />
          <ConnectionPill state="offline" label="অফলাইন · শুধু সময়সূচি" />
        </Stack>
      ),
    },
  ],
};
