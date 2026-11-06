import type { GalleryEntry } from '../../galleryTypes';
import { IconButton } from '../../ui/IconButton';

import { ScreenHeader } from './index';

export const gallery: GalleryEntry = {
  name: 'ScreenHeader',
  layer: 'metro',
  variants: [
    { label: 'title only', render: () => <ScreenHeader title="সময়সূচি" /> },
    { label: 'back + right', render: () => <ScreenHeader title="যাত্রার ইতিহাস" subtitle="নভেম্বর" onBack={() => undefined} right={<IconButton icon="trash" accessibilityLabel="Clear" />} /> },
  ],
};
