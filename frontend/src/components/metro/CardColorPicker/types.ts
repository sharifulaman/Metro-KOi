import type { CardColor } from '@/theme/tokens';

export interface CardColorPickerProps {
  value: CardColor;
  onChange(color: CardColor): void;
  /** accessibility label per swatch, e.g. {green: "Green"} */
  labels: Record<CardColor, string>;
  testID?: string;
}
