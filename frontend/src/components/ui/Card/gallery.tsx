import type { GalleryEntry } from '../../galleryTypes';
import { Text } from '../Text';

import { Card } from './index';

export const gallery: GalleryEntry = {
  name: 'Card',
  layer: 'ui',
  variants: [
    { label: 'surface elevated', render: () => <Card elevated><Text>সাদা কার্ড</Text></Card> },
    { label: 'brand hero', render: () => <Card tone="brand" radius="hero"><Text tone="onBrand">মাসের সারাংশ</Text></Card> },
    { label: 'alt', render: () => <Card tone="alt"><Text tone="muted">Alt surface</Text></Card> },
  ],
};
