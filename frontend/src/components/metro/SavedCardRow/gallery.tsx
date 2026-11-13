import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { SavedCardRow } from './index';

export const gallery: GalleryEntry = {
  name: 'SavedCardRow',
  layer: 'metro',
  variants: [
    {
      label: 'default card, then one with no balance',
      render: () => (
        <View style={{ width: 342 }}>
          <SavedCardRow
            name="My metro card"
            tail="4821"
            typeLabel="Rapid Pass"
            color="green"
            balanceBdt={340}
            isDefault
            defaultLabel="Default"
            noBalanceLabel="No balance info"
            editLabel="Edit"
            deleteLabel="Delete"
            onEdit={() => {}}
            onDelete={() => {}}
            divider
          />
          <SavedCardRow
            name="Dad's card"
            tail="9302"
            typeLabel="MRT Pass"
            color="dark"
            balanceBdt={null}
            isDefault={false}
            defaultLabel="Default"
            noBalanceLabel="No balance info"
            editLabel="Edit"
            deleteLabel="Delete"
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </View>
      ),
    },
  ],
};
