import { useState } from 'react';

import type { Gate } from '@/models';

import type { GalleryEntry } from '../../galleryTypes';

import { GateSelector } from './index';
import type { GateSelectorProps } from './types';

const gates: GateSelectorProps['gates'] = [
  { gate: 'A', corner: 'NW', hasLift: null },
  { gate: 'B', corner: 'NE', hasLift: true, hasEscalator: true, landmark: 'Bus stop' },
  { gate: 'C', corner: 'SW' },
  { gate: 'D', corner: 'SE' },
];
const labels: GateSelectorProps['labels'] = {
  gate: (g) => `গেট ${g}`,
  corner: (c) => c,
  nearest: 'কাছের গেট',
  lift: 'লিফট',
  escalator: 'এসকেলেটর',
  unknown: 'তথ্য শীঘ্রই',
};

function Demo({ variant }: { variant: GateSelectorProps['variant'] }) {
  const [sel, setSel] = useState<Gate>('A');
  return <GateSelector variant={variant} gates={gates} selected={sel} recommended="B" onSelect={setSel} labels={labels} />;
}

export const gallery: GalleryEntry = {
  name: 'GateSelector',
  layer: 'metro',
  variants: [
    { label: 'chips', render: () => <Demo variant="chips" /> },
    { label: 'cards', render: () => <Demo variant="cards" /> },
    { label: 'pins', render: () => <Demo variant="pins" /> },
  ],
};
