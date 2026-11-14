import { View } from 'react-native';

import type { GalleryEntry } from '../../galleryTypes';

import { ScanView } from './index';

const props = {
  title: 'Scan card',
  closeLabel: 'Close',
  onClose: () => {},
  heading: 'Hold the card to the back of the phone',
  hint: 'Keep the card in the middle of the phone and don’t move it until the read finishes.',
  retryLabel: 'Scan again',
  onRetry: () => {},
  androidHint: 'Android: finds the card on its own while NFC is on',
  iosHint: 'iPhone: a system sheet comes up from the bottom once scanning starts',
  cancelLabel: 'Cancel',
  card: { name: 'My metro card', tail: '4821', typeLabel: 'Rapid Pass card' },
};

export const gallery: GalleryEntry = {
  name: 'ScanView',
  layer: 'metro',
  variants: [
    { label: 'waiting', render: () => <View style={{ height: 760, width: 390 }}><ScanView {...props} /></View> },
    { label: 'scan failed', render: () => <View style={{ height: 760, width: 390 }}><ScanView {...props} error="This build can't read cards." /></View> },
  ],
};
