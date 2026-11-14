import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { SavedCardsView } from './index';

export const gallery: GalleryEntry = {
  name: 'SavedCardsView',
  layer: 'metro',
  variants: [
    {
      label: 'three cards',
      render: () => (
        <View style={{ height: 760, width: 390 }}>
          <SavedCardsView
            title="Saved cards"
            backLabel="Back"
            addLabel="Add a card"
            cards={[
              { id: 'a', name: 'My metro card', tail: '4821', tailText: '•••• 4821', typeLabel: 'Rapid Pass card', color: 'green', balance: '৳ 340', isDefault: true, confirming: false },
              { id: 'b', name: 'Office card', tail: '1709', tailText: '•••• 1709', typeLabel: 'Rapid Pass card', color: 'gold', balance: '৳ 120', isDefault: false, confirming: false },
              { id: 'c', name: "Dad's card", tail: '9302', tailText: '•••• 9302', typeLabel: 'MRT Pass card', color: 'dark', balance: null, isDefault: false, confirming: false },
            ]}
            defaultLabel="Default"
            noBalanceLabel="No balance info"
            editLabel="Edit"
            deleteLabel="Delete"
            confirmText="Delete this card?"
            note="Card name, colour and last 4 digits are saved only on this phone."
            newCardLabel="Add a new card"
            onBack={() => {}}
            onAdd={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onSetDefault={() => {}}
          />
        </View>
      ),
    },
  ],
};
