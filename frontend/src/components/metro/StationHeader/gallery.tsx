import type { GalleryEntry } from '../../galleryTypes';

import { StationHeader } from './index';

export const gallery: GalleryEntry = {
  name: 'StationHeader',
  layer: 'metro',
  variants: [
    {
      label: 'full',
      render: () => (
        <StationHeader name="ফার্মগেট" altName="Farmgate" orderLabel="১৬টির মধ্যে ১১" lineChip="এমআরটি লাইন ৬" distance="২২০ মি. দূরে" favourite onFavourite={() => undefined} />
      ),
    },
    { label: 'compact (3D panel)', render: () => <StationHeader name="Farmgate" altName="ফার্মগেট" compact /> },
  ],
};
