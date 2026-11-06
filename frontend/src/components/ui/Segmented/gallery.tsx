import { useState } from 'react';

import type { GalleryEntry } from '../../galleryTypes';

import { Segmented } from './index';

function Demo({ variant }: { variant: 'tabs' | 'pill' }) {
  const [v, setV] = useState<'a' | 'b' | 'c'>('a');
  return (
    <Segmented<'a' | 'b' | 'c'>
      variant={variant}
      value={v}
      onChange={setV}
      options={[
        { value: 'a', label: 'রবি–বৃহস্পতি' },
        { value: 'b', label: 'শুক্রবার' },
        { value: 'c', label: 'শনিবার' },
      ]}
    />
  );
}

export const gallery: GalleryEntry = {
  name: 'Segmented',
  layer: 'ui',
  variants: [
    { label: 'pill', render: () => <Demo variant="pill" /> },
    { label: 'tabs', render: () => <Demo variant="tabs" /> },
  ],
};
