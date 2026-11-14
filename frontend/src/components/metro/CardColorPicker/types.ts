import type { CardColor } from '@/theme/tokens';

export interface CardColorPickerProps {
  value: CardColor;
  onChange(color: CardColor): void;
  /** accessibility label per swatch, e.g. {green: "Green"} */
  labels: Record<CardColor, string>;
  /** swatch diameter in px (design: 40 on the save sheet, 38 on the manual form) */
  size?: number;
  /** colour of the gap ring around the chosen swatch: the surface it sits on */
  ringOn?: 'surface' | 'bg';
  testID?: string;
}
