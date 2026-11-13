import type { GalleryEntry } from '../../galleryTypes';

import { StationTimeline } from './index';

const stations = [
  { id: 'a', order: '১', name: 'উত্তরা উত্তর', altName: 'Uttara North', terminal: 'start' as const, eta: { label: '৪ মি', kind: 'schedule' as const } },
  { id: 'b', order: '২', name: 'উত্তরা সেন্টার', altName: 'Uttara Center', eta: { label: '৬ মি', kind: 'schedule' as const } },
  { id: 'c', order: '৩', name: 'পল্লবী', altName: 'Pallabi', eta: { label: '২ মি', kind: 'live' as const } },
  { id: 'd', order: '৪', name: 'মতিঝিল', altName: 'Motijheel', terminal: 'end' as const, eta: { label: '৬:৩০', kind: 'closed' as const } },
];

export const gallery: GalleryEntry = {
  name: 'StationTimeline',
  layer: 'metro',
  variants: [{ label: 'four stops, a live train between 2 and 3', render: () => <StationTimeline stations={stations} train={{ afterIndex: 1, progress: 0.6, live: true }} labels={{ start: 'শুরু', end: 'শেষ' }} /> }],
};
