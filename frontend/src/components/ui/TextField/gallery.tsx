import { useState } from 'react';
import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { TextField } from './index';

function Demo() {
  const [name, setName] = useState('My metro card');
  const [tail, setTail] = useState('4821');
  return (
    <View style={{ width: 320, gap: 12 }}>
      <TextField label="Card name" value={name} onChangeText={setName} />
      <TextField label="Last 4 digits" value={tail} onChangeText={setTail} keyboardType="numeric" maxLength={4} />
    </View>
  );
}

export const gallery: GalleryEntry = {
  name: 'TextField',
  layer: 'ui',
  variants: [{ label: 'interactive', render: () => <Demo /> }],
};
