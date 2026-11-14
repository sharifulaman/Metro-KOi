export interface SpeedometerProps {
  /** km/h, already absolute */
  value: number;
  /** end of the scale, km/h (default 100: the line's top speed) */
  max?: number;
  /** "km/h" */
  unit: string;
  /** the number as shown ("৫২" in Bangla) */
  valueLabel: string;
  /** width in px; height is half of it plus room for the number */
  size?: number;
  testID?: string;
}
