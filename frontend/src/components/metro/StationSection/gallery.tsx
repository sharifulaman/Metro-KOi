import type { GalleryEntry } from '../../galleryTypes';

import { StationSection } from './index';

const labels = { concourse: 'কনকোর্স', platform1: 'প্ল্যাটফর্ম ১ → মতিঝিল', platform2: 'প্ল্যাটফর্ম ২ → উত্তরা', street: 'রাস্তা' };

export const gallery: GalleryEntry = {
  name: 'StationSection',
  layer: 'metro',
  variants: [
    { label: 'entry A → platform 1', render: () => <StationSection gate="A" platform={1} trainAt={1} labels={labels} /> },
    { label: 'exit D, roof closed', render: () => <StationSection gate="D" platform={2} mode="exit" roofOpen={false} labels={labels} /> },
  ],
};
