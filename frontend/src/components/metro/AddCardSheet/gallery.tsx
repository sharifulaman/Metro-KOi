import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { AddCardSheet } from './index';

export const gallery: GalleryEntry = {
  name: 'AddCardSheet',
  layer: 'metro',
  variants: [
    {
      label: 'over a dimmed page',
      render: () => (
        <View style={{ height: 620, width: 390 }}>
          <AddCardSheet
            title="Add a card"
            subtitle="How would you like to save it?"
            scanTitle="Scan to save"
            scanBadge="Easy"
            scanBody="Hold the card to the back of the phone. The balance shows automatically if it can be read."
            manualTitle="Save by hand"
            manualBody="Just a name and the last 4 digits. The balance won't show, but trips are saved."
            cancelLabel="Cancel"
            onScan={() => {}}
            onManual={() => {}}
            onCancel={() => {}}
          />
        </View>
      ),
    },
  ],
};
