import { useState } from 'react';
import { View } from 'react-native';

import type { CardColor } from '@/theme/tokens';

import type { GalleryEntry } from '../../galleryTypes';

import { FoundView } from './index';

function Demo({ known }: { known: boolean }) {
  const [color, setColor] = useState<CardColor>('green');
  const [name, setName] = useState('My metro card');
  return (
    <View style={{ height: 760, width: 390 }}>
      <FoundView
        title="Card found"
        card={{ name, tail: '4821', typeLabel: 'Rapid Pass card' }}
        color={color}
        balanceLabel="Balance"
        amount={known ? '340' : null}
        noInfoTitle="Balance: no info"
        badgeLabel={known ? 'Read from card' : 'History only'}
        badgeTone={known ? 'brand' : 'neutral'}
        nameLabel="Card name"
        name={name}
        onName={setName}
        colorLabel="Card colour"
        onColor={setColor}
        colorLabels={{ green: 'Green', dark: 'Dark', gold: 'Gold', blue: 'Blue' }}
        saveLabel="Save"
        onSave={() => {}}
        rescanLabel="Scan again"
        onRescan={() => {}}
      />
    </View>
  );
}

export const gallery: GalleryEntry = {
  name: 'FoundView',
  layer: 'metro',
  variants: [
    { label: 'balance read', render: () => <Demo known /> },
    { label: 'no balance info', render: () => <Demo known={false} /> },
  ],
};
