import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { DirectionEtaCard } from './index';

export const gallery: GalleryEntry = {
  name: 'DirectionEtaCard',
  layer: 'metro',
  variants: [
    {
      label: 'live now + two estimates / estimates only',
      render: () => (
        <View style={{ gap: 10 }}>
          <DirectionEtaCard title="মতিঝিলের দিকে" platformLabel="প্ল্যাটফর্ম ১" emptyText="—" tiles={[{ value: 'এখন', caption: 'লাইভ', live: true }, { value: '~৯ মি', caption: 'আনুমানিক' }, { value: '~১৯ মি', caption: 'আনুমানিক' }]} />
          <DirectionEtaCard title="To Uttara North" platformLabel="Platform 2" emptyText="No more trains today" tiles={[{ value: '5 min', caption: 'Estimated' }, { value: '~15 min', caption: 'Estimated' }]} />
        </View>
      ),
    },
  ],
};
