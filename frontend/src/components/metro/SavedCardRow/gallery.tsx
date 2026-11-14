import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { SavedCardRow } from './index';

const base = { typeLabel: 'Rapid Pass card', defaultLabel: 'Default', noBalanceLabel: 'No balance info', editLabel: 'Edit', deleteLabel: 'Delete', onEdit: () => {}, onDelete: () => {} };

export const gallery: GalleryEntry = {
  name: 'SavedCardRow',
  layer: 'metro',
  variants: [
    {
      label: 'default card, then one with no balance',
      render: () => (
        <View style={{ width: 350 }}>
          <SavedCardRow {...base} name="My metro card" tail="4821" tailText="•••• 4821" color="green" balance="৳ 340" isDefault divider />
          <SavedCardRow {...base} name="Dad's card" tail="9302" tailText="•••• 9302" color="dark" balance={null} isDefault={false} />
        </View>
      ),
    },
    {
      label: 'asking to confirm delete',
      render: () => (
        <View style={{ width: 350 }}>
          <SavedCardRow {...base} name="Office card" tail="1709" tailText="•••• 1709" color="gold" balance="৳ 120" isDefault={false} confirming confirmText="Delete this card?" />
        </View>
      ),
    },
  ],
};
