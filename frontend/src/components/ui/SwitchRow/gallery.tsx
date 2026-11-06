import { useState } from 'react';

import type { GalleryEntry } from '../../galleryTypes';

import { SwitchRow } from './index';

function Demo() {
  const [v, setV] = useState(true);
  return <SwitchRow label="ছাদ খুলে দেখুন" subtitle="3D" value={v} onValueChange={setV} divider />;
}

export const gallery: GalleryEntry = {
  name: 'SwitchRow',
  layer: 'ui',
  variants: [{ label: 'toggle', render: () => <Demo /> }],
};
