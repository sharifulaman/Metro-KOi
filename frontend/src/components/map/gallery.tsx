import { View } from 'react-native';
import Svg from 'react-native-svg';

import type { GalleryEntry } from '../galleryTypes';

import { GatePin } from './GatePin';
import { GoogleMapView, ZOOM_NEAR } from './GoogleMapView';
import { WalkingPathLayer } from './WalkingPathLayer';

const stations = ['Uttara N', 'Pallabi', 'Mirpur-10', 'Agargaon', 'Farmgate', 'Shahbagh', 'Motijheel'].map((label, i, a) => ({ id: label, label, f: i / (a.length - 1) }));
const errorText = 'Google Maps could not load. Check the internet connection and EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.';

export const gallery: GalleryEntry = {
  name: 'map/* (GoogleMapView, GatePin, WalkingPathLayer)',
  layer: 'map',
  variants: [
    {
      label: 'GoogleMapView close-up: live, dwelling (timer tag) and estimated trains',
      render: () => (
        <View style={{ height: 380 }}>
          <GoogleMapView
            stations={stations}
            selectedStation="Farmgate"
            zoom={ZOOM_NEAR}
            focus={4 / 6}
            trains={[
              { id: 'T-17', dir: 'SB', state: 'LIVE', f: 4 / 6 - 0.012, label: 'T-17 · Live' },
              { id: 'T-12', dir: 'NB', state: 'LIVE', f: 4 / 6, label: 'T-12 · leaves in', dwell: { timer: '0:14', progress: 0.7 } },
              { id: 'T-21', dir: 'SB', state: 'ESTIMATED', f: 5 / 6 - 0.03 },
            ]}
            errorText={errorText}
          />
        </View>
      ),
    },
    {
      label: 'GoogleMapView whole line',
      render: () => (
        <View style={{ height: 300 }}>
          <GoogleMapView
            stations={stations}
            trains={[
              { id: 'a', dir: 'SB', state: 'LIVE', f: 0.35 },
              { id: 'b', dir: 'NB', state: 'ESTIMATED', f: 0.7 },
            ]}
            errorText={errorText}
          />
        </View>
      ),
    },
    {
      label: 'gate pins & walking path',
      render: () => (
        <Svg width="100%" height={130} viewBox="0 0 340 130">
          <WalkingPathLayer d="M260,95 L300,60" />
          <GatePin x={260} y={95} gate="A" selected />
          <GatePin x={300} y={40} gate="B" recommended />
        </Svg>
      ),
    },
  ],
};
