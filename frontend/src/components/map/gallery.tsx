import { View } from 'react-native';
import Svg from 'react-native-svg';

import type { GalleryEntry } from '../galleryTypes';

import { GatePin } from './GatePin';
import { LineLayer } from './LineLayer';
import { MapView3D } from './MapView3D';
import { StationPin } from './StationPin';
import { TrainMarker } from './TrainMarker';
import { WalkingPathLayer } from './WalkingPathLayer';

const stations = ['Uttara N', 'Pallabi', 'Mirpur-10', 'Agargaon', 'Farmgate', 'Shahbagh', 'Motijheel'].map((label, i, a) => ({ id: label, label, f: i / (a.length - 1) }));

export const gallery: GalleryEntry = {
  name: 'map/* (MapView3D, TrainMarker, StationPin, GatePin, LineLayer, WalkingPathLayer)',
  layer: 'map',
  variants: [
    {
      label: 'MapView3D schematic',
      render: () => (
        <View style={{ height: 320 }}>
          <MapView3D
            stations={stations}
            selectedStation="Farmgate"
            trains={[
              { id: 'a', dir: 'SB', state: 'LIVE', f: 0.35 },
              { id: 'b', dir: 'NB', state: 'ESTIMATED', f: 0.7 },
            ]}
            attribution="© OpenStreetMap contributors"
          />
        </View>
      ),
    },
    {
      label: 'markers & pins',
      render: () => (
        <Svg width="100%" height={110} viewBox="0 0 340 110">
          <LineLayer d="M10,60 L330,60" />
          <WalkingPathLayer d="M260,95 L300,60" />
          <StationPin x={60} y={60} label="Farmgate" highlighted />
          <TrainMarker x={140} y={60} bearing={90} dir="SB" state="LIVE" />
          <TrainMarker x={200} y={60} bearing={90} dir="NB" state="ESTIMATED" />
          <GatePin x={260} y={95} gate="A" selected />
          <GatePin x={300} y={40} gate="B" recommended />
        </Svg>
      ),
    },
  ],
};
