import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { TransactionRow } from './index';

export const gallery: GalleryEntry = {
  name: 'TransactionRow',
  layer: 'metro',
  variants: [
    {
      label: 'trip + recharge',
      render: () => (
        <View style={{ width: 342 }}>
          <TransactionRow kind="trip" title="Agargaon → Motijheel" time="Today 08:12" amount="−৳ 40" divider />
          <TransactionRow kind="recharge" title="Recharge" time="Yesterday 21:30" amount="+৳ 500" />
        </View>
      ),
    },
  ],
};
