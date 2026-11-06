import type { GalleryEntry } from '../../galleryTypes';

import { EmptyState } from './index';

export const gallery: GalleryEntry = {
  name: 'EmptyState',
  layer: 'metro',
  variants: [
    { label: 'offline', render: () => <EmptyState compact icon="offline" title="আপনি অফলাইনে আছেন" body="সময়সূচি থেকে আনুমানিক অবস্থান দেখানো হচ্ছে।" /> },
    { label: 'not running + action', render: () => <EmptyState compact icon="clock" title="Service not running" body="First train 6:30 AM" action={{ label: 'Timetable', onPress: () => undefined }} /> },
  ],
};
