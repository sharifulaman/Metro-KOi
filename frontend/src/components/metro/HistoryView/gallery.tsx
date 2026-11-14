import { useState } from 'react';
import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { HistoryView } from './index';

function Demo() {
  const [filter, setFilter] = useState('all');
  return (
    <View style={{ height: 760, width: 390 }}>
      <HistoryView
        title="Trip history"
        backLabel="Back"
        onBack={() => {}}
        tripsLabel="Trips this month"
        trips="14"
        spendLabel="Total spent"
        spend="৳ 560"
        privacyNote="History stays on this phone"
        clearLabel="Clear history"
        canClear
        onClear={() => {}}
        tabs={[
          { value: 'all', label: 'All' },
          { value: 'trip', label: 'Trips' },
          { value: 'recharge', label: 'Recharges' },
        ]}
        filter={filter}
        onFilter={setFilter}
        groups={[{ key: 'd0', label: 'Today', rows: [{ id: '1', kind: 'trip', title: 'Agargaon → Motijheel', time: '08:12', amount: '−৳ 40' }] }]}
        emptyTitle="No trips yet"
        emptyBody="Trips you save will appear here."
      />
    </View>
  );
}

export const gallery: GalleryEntry = { name: 'HistoryView', layer: 'metro', variants: [{ label: 'with trips', render: () => <Demo /> }] };
