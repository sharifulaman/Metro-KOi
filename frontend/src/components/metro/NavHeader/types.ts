export interface NavHeaderProps {
  /** left circular button; omit for none */
  left?: { icon: 'back' | 'close'; label: string; onPress(): void };
  title: string;
  /** right circular button; omit for an empty spacer so the title stays centred */
  right?: { icon: 'add'; label: string; onPress(): void };
  testID?: string;
}
