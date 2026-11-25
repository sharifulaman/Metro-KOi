import { useState } from 'react';
import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { StationsView } from './index';

const stations = [
  { id: 'a', order: '1', name: 'Uttara North', altName: 'উত্তরা উত্তর', terminal: 'start' as const, eta: { label: '4 min', kind: 'schedule' as const } },
  { id: 'b', order: '2', name: 'Uttara Center', altName: 'উত্তরা সেন্টার', eta: { label: '2 min', kind: 'live' as const } },
  { id: 'c', order: '3', name: 'Motijheel', altName: 'মতিঝিল', terminal: 'end' as const },
];

function Demo() {
  const [dir, setDir] = useState('SB');
  return (
    <View style={{ height: 760, width: 390 }}>
      <StationsView
        title="Stations"
        subtitle="Metro Line 6 · 16 stations"
        timetableLabel="Timetable"
        onTimetable={() => {}}
        dirs={[{ key: 'SB', label: 'Towards Motijheel' }, { key: 'NB', label: 'Towards Uttara' }]}
        dir={dir}
        onDir={setDir}
        banner={{ mode: 'nearest', caption: 'Your nearest station', title: 'Farmgate', subtitle: '220 m · 3 min walk', eta: { label: '4 min', live: true, badge: 'Live' } }}
        timeline={{ stations, labels: { start: 'Start', end: 'End' }, train: { afterIndex: 0, progress: 0.4, live: true } }}
      />
    </View>
  );
}

export const gallery: GalleryEntry = { name: 'StationsView', layer: 'metro', variants: [{ label: 'nearest + live train', render: () => <Demo /> }] };
