import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { StationDetailView } from './index';

const tiles = (a: string) => [
  { value: 'Now', caption: 'Live', live: true },
  { value: '~9 min', caption: a, live: false },
  { value: '~19 min', caption: a, live: false },
];

export const gallery: GalleryEntry = {
  name: 'StationDetailView',
  layer: 'metro',
  variants: [
    {
      label: 'Farmgate',
      render: () => (
        <View style={{ height: 844, width: 390 }}>
          <StationDetailView
            trainTag="SB-0630 · at the station"
            order="11"
            lineLine="MRT Line 6 · ফার্মগেট"
            name="Farmgate"
            dirs={[
              { key: 'SB', title: 'Towards Motijheel', platform: 'Platform 1', tiles: tiles('Estimated') },
              { key: 'NB', title: 'Towards Uttara North', platform: 'Platform 2', tiles: tiles('Estimated').slice(1) },
            ]}
            facts={[
              { icon: 'pin', value: 'Gates A B C D', label: '4 entrances' },
              { icon: 'layers', value: '2', label: 'platforms' },
              { icon: 'locate', value: '220 m', label: 'from you' },
            ]}
            journeyLabel="Journey from here"
            view3dLabel="View in 3D"
            backLabel="Back"
            favouriteLabel="Favourite"
            favourite={false}
            onBack={() => {}}
            onFavourite={() => {}}
            onJourney={() => {}}
            onView3d={() => {}}
          />
        </View>
      ),
    },
  ],
};
