import type { GalleryEntry } from '../../galleryTypes';

import { Text } from './index';

export const gallery: GalleryEntry = {
  name: 'Text',
  layer: 'ui',
  variants: [
    { label: 'display', render: () => <Text variant="display">ফার্মগেট Farmgate</Text> },
    { label: 'title / heading', render: () => <Text variant="title">Platform 1 → Motijheel</Text> },
    { label: 'body muted', render: () => <Text tone="muted">পরের ট্রেন আসছে</Text> },
    { label: 'label brand', render: () => <Text variant="label" tone="brand">এমআরটি লাইন ৬</Text> },
    { label: 'micro', render: () => <Text variant="micro">© OpenStreetMap</Text> },
    { label: 'countdown', render: () => <Text variant="countdown">০২:৩০</Text> },
  ],
};
