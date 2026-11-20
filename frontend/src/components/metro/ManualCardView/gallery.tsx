import { useState } from 'react';
import { View } from 'react-native';

import type { CardColor } from '@/theme/tokens';

import type { GalleryEntry } from '../../galleryTypes';

import { ManualCardView } from './index';

function Demo() {
  const [color, setColor] = useState<CardColor>('dark');
  const [name, setName] = useState("Dad's card");
  const [tail, setTail] = useState('9302');
  return (
    <View style={{ height: 760, width: 390 }}>
      <ManualCardView
        title="Save by hand"
        closeLabel="Close"
        onClose={() => {}}
        preview={{ name, tail, typeLabel: 'Rapid Pass card' }}
        nameLabel="Card name"
        name={name}
        onName={setName}
        tailLabel="Last 4 digits"
        tail={tail}
        onTail={setTail}
        colorLabel="Card colour"
        color={color}
        onColor={setColor}
        colorLabels={{ green: 'Green', dark: 'Dark', gold: 'Gold', blue: 'Blue', original: 'Original card' }}
        note="You don't need the full card number. Name, colour and last 4 digits are saved only on this phone."
        saveLabel="Save"
        canSave
        onSave={() => {}}
        scanLabel="Scan to save instead"
        onScan={() => {}}
      />
    </View>
  );
}

export const gallery: GalleryEntry = { name: 'ManualCardView', layer: 'metro', variants: [{ label: 'dark card selected', render: () => <Demo /> }] };
