import type { GalleryEntry } from '../../galleryTypes';

import { Button } from './index';

export const gallery: GalleryEntry = {
  name: 'Button',
  layer: 'ui',
  variants: [
    { label: 'primary lg + icon', render: () => <Button label="স্টেশন ৩ডি দেখুন" icon="box" /> },
    { label: 'secondary', render: () => <Button label="গেট A B C D" variant="secondary" icon="gate" /> },
    { label: 'ghost md', render: () => <Button label="Not now" variant="ghost" size="md" /> },
    { label: 'dangerText', render: () => <Button label="মুছুন" variant="dangerText" icon="trash" /> },
    { label: 'loading / disabled', render: () => <Button label="Share my ride" loading /> },
    { label: 'floating FAB', render: () => <Button label="আমি মেট্রোতে আছি" icon="train" floating /> },
  ],
};
