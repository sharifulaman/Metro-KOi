import type { GalleryEntry } from '../../galleryTypes';

import { DepartureRow } from './index';

export const gallery: GalleryEntry = {
  name: 'DepartureRow',
  layer: 'metro',
  variants: [
    { label: 'live', render: () => <DepartureRow etaSec={120} source="live" trainId="T-17" divider /> },
    { label: 'schedule + note', render: () => <DepartureRow etaSec={540} source="schedule" note="Arrive 8:42 · 18 min" trailing="৳৬০" /> },
    { label: 'now', render: () => <DepartureRow etaSec={10} source="live" trainId="T-12" /> },
  ],
};
