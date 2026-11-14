import { useState } from 'react';
import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { WalletHome } from './index';

const cards = [
  { id: 'a', name: 'My metro card', tail: '4821', typeLabel: 'Rapid Pass card', color: 'green' as const },
  { id: 'b', name: 'Office card', tail: '1709', typeLabel: 'Rapid Pass card', color: 'gold' as const },
];

function Demo({ known }: { known: boolean }) {
  const [index, setIndex] = useState(0);
  return (
    <View style={{ height: 760, width: 390 }}>
      <WalletHome
        title="Card"
        subtitle="Save your card to see its balance"
        addLabel="Add a card"
        savedLabel="Saved cards · 2"
        viewAllLabel="See all"
        cards={cards}
        index={index}
        onIndexChange={setIndex}
        balance={{ label: 'Current balance', badgeLabel: known ? 'Read from card' : 'History only', badgeTone: known ? 'brand' : 'neutral', amount: known ? '340' : null, caption: 'Last tap: today 08:12', noInfoTitle: 'Balance: no info' }}
        scanLabel="Scan card"
        historyLabel="Trip history"
        editLabel="Edit"
        recentLabel="Recent trips"
        recent={[{ id: '1', kind: 'trip', title: 'Agargaon → Motijheel', when: 'Today 08:12', amount: '−৳ 40' }]}
        onAdd={() => {}}
        onViewAll={() => {}}
        onScan={() => {}}
        onHistory={() => {}}
        onEdit={() => {}}
      />
    </View>
  );
}

export const gallery: GalleryEntry = {
  name: 'WalletHome',
  layer: 'metro',
  variants: [
    { label: 'balance read from the card', render: () => <Demo known /> },
    { label: 'no balance info', render: () => <Demo known={false} /> },
  ],
};
