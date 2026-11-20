import { useState } from 'react';

import type { GalleryEntry } from '../../galleryTypes';

import { CardColorPicker } from './index';

const labels = { green: 'Green', dark: 'Dark', gold: 'Gold', blue: 'Blue', original: 'Original card' } as const;

function Demo() {
  const [value, setValue] = useState<'green' | 'dark' | 'gold' | 'blue' | 'original'>('green');
  return <CardColorPicker value={value} onChange={setValue} labels={labels} original />;
}

export const gallery: GalleryEntry = {
  name: 'CardColorPicker',
  layer: 'metro',
  variants: [{ label: 'interactive', render: () => <Demo /> }],
};
