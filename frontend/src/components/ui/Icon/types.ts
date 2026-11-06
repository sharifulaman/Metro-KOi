import type { TextTone } from '../Text/types';

export type IconName =
  | 'train' | 'map' | 'list' | 'route' | 'card' | 'more' | 'search' | 'star' | 'back' | 'chevron'
  | 'swap' | 'locate' | 'compass' | 'box' | 'gate' | 'walk' | 'info' | 'shield' | 'bell' | 'globe'
  | 'moon' | 'sun' | 'history' | 'wallet' | 'nfc' | 'live' | 'clock' | 'users' | 'arrowRight'
  | 'layers' | 'close' | 'stop' | 'share' | 'trash' | 'offline' | 'gpsOff' | 'calendar' | 'building'
  | 'lift' | 'scan' | 'settings' | 'ticket' | 'receipt' | 'dot' | 'accessibility';

export interface IconProps {
  name: IconName;
  size?: number;
  tone?: TextTone | 'live' | 'outline';
  /** explicit colour from a token, overrides tone */
  color?: string;
  strokeWidth?: number;
  testID?: string;
}
