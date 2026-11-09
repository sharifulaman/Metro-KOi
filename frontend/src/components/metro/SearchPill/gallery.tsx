import type { GalleryEntry } from '../../galleryTypes';

import { SearchPill } from './index';

export const gallery: GalleryEntry = {
  name: 'SearchPill',
  layer: 'metro',
  variants: [
    { label: 'with language toggle', render: () => <SearchPill placeholder="স্টেশন বা জায়গা খুঁজুন" langLabel="বাং · EN" /> },
    { label: 'plain', render: () => <SearchPill placeholder="Station or place" /> },
  ],
};
