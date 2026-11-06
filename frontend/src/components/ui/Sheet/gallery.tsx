import { useState } from 'react';

import type { GalleryEntry } from '../../galleryTypes';
import { Text } from '../Text';

import { Sheet } from './index';

function Demo() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Sheet collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} peek={<Text tone="muted">Peek</Text>}>
      <Text variant="title">ফার্মগেট</Text>
      <Text tone="muted">Tap the handle to collapse.</Text>
    </Sheet>
  );
}

export const gallery: GalleryEntry = {
  name: 'Sheet',
  layer: 'ui',
  variants: [{ label: 'inline, collapsible', render: () => <Demo /> }],
};
