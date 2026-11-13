import { useState } from 'react';

import type { GalleryEntry } from '../../galleryTypes';

import { WalletCarousel } from './index';

const cards = [
  { id: 'a', name: 'My metro card', tail: '4821', typeLabel: 'Rapid Pass', color: 'green' as const },
  { id: 'b', name: 'Office card', tail: '1709', typeLabel: 'Rapid Pass', color: 'gold' as const },
  { id: 'c', name: "Dad's card", tail: '9302', typeLabel: 'MRT Pass', color: 'dark' as const },
];

function Demo() {
  const [index, setIndex] = useState(0);
  return <WalletCarousel cards={cards} index={index} onIndexChange={setIndex} />;
}

export const gallery: GalleryEntry = {
  name: 'WalletCarousel',
  layer: 'metro',
  variants: [{ label: '3 saved cards', render: () => <Demo /> }],
};
