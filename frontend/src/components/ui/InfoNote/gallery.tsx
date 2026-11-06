import type { GalleryEntry } from '../../galleryTypes';

import { InfoNote } from './index';

export const gallery: GalleryEntry = {
  name: 'InfoNote',
  layer: 'ui',
  variants: [
    { label: 'privacy', render: () => <InfoNote icon="shield" text="ইতিহাস শুধু এই ফোনে সংরক্ষিত থাকে।" /> },
    { label: 'live + action', render: () => <InfoNote tone="live" icon="users" text="Crowd bars are sample data." action={{ label: 'Learn more', onPress: () => undefined }} /> },
    { label: 'danger', render: () => <InfoNote tone="danger" icon="gpsOff" text="Location permission is off." /> },
  ],
};
