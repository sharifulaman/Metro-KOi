import { useState } from 'react';

import type { GalleryEntry } from '../../galleryTypes';

import { CardColorPicker } from './index';

const labels = { green: 'Green', dark: 'Dark', gold: 'Gold', blue: 'Blue' } as const;

function Demo() {
  const [value, setValue] = useState<'green' | 'dark' | 'gold' | 'blue'>('green');
  return <CardColorPicker value={value} onChange={setValue} labels={labels} />;
}

export const gallery: GalleryEntry = {
  name: 'CardColorPicker',
  layer: 'metro',
  variants: [{ label: 'interactive', render: () => <Demo /> }],
};
