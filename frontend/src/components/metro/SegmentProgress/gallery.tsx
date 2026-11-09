import type { GalleryEntry } from '../../galleryTypes';

import { SegmentProgress } from './index';

export const gallery: GalleryEntry = {
  name: 'SegmentProgress',
  layer: 'metro',
  variants: [
    { label: 'SB, 40 %', render: () => <SegmentProgress fromLabel="ফার্মগেট" toLabel="কারওয়ান বাজার" progress={0.4} direction="SB" caption="পৌঁছাবে ~১ মিনিটে" /> },
    { label: 'NB, leaving', render: () => <SegmentProgress fromLabel="Agargaon" toLabel="Shewrapara" progress={0.05} direction="NB" /> },
  ],
};
