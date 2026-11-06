import { useState } from 'react';

import type { GalleryEntry } from '../../galleryTypes';

import { TabBar, type TabKey } from './index';

const labels = { live: 'লাইভ', stations: 'স্টেশন', journey: 'যাত্রা', card: 'কার্ড', more: 'আরও' };

function Demo() {
  const [active, setActive] = useState<TabKey>('live');
  return <TabBar active={active} onSelect={setActive} labels={labels} />;
}

export const gallery: GalleryEntry = { name: 'TabBar', layer: 'metro', variants: [{ label: '5 tabs', render: () => <Demo /> }] };
