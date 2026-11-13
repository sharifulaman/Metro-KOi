import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { BalancePanel } from './index';

export const gallery: GalleryEntry = {
  name: 'BalancePanel',
  layer: 'metro',
  variants: [
    {
      label: 'balance read from the card',
      render: () => (
        <View style={{ width: 342 }}>
          <BalancePanel
            label="Current balance"
            badgeLabel="Read from card"
            badgeTone="brand"
            balanceBdt={340}
            caption="Last tap: today 08:12 · Agargaon → Motijheel"
            noInfoLabel="No balance info"
          />
        </View>
      ),
    },
    {
      label: 'no balance info',
      render: () => (
        <View style={{ width: 342 }}>
          <BalancePanel
            label="Current balance"
            badgeLabel="History only"
            badgeTone="neutral"
            balanceBdt={null}
            caption="The balance could not be read from this card. Every scan and trip is still saved on this phone."
            noInfoLabel="No balance info"
          />
        </View>
      ),
    },
  ],
};
