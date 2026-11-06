import type { GalleryEntry } from '../../galleryTypes';

import { PlatformGroup } from './index';

export const gallery: GalleryEntry = {
  name: 'PlatformGroup',
  layer: 'metro',
  variants: [
    {
      label: 'platform 1',
      render: () => (
        <PlatformGroup
          platform={1}
          direction="SB"
          title="প্ল্যাটফর্ম ১ → মতিঝিল"
          rows={[
            { key: 'a', etaSec: 120, source: 'live', trainId: 'T-17' },
            { key: 'b', etaSec: 540, source: 'schedule' },
          ]}
        />
      ),
    },
    { label: 'empty', render: () => <PlatformGroup platform={2} direction="NB" title="Platform 2 → Uttara North" rows={[]} emptyText="No more trains today" /> },
  ],
};
