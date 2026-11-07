export interface JourneyPickerProps {
  /** "From" / "To" captions, already translated */
  fromCaption: string;
  toCaption: string;
  fromLabel: string;
  toLabel: string;
  onFrom(): void;
  onTo(): void;
  onSwap(): void;
  swapLabel: string;
  testID?: string;
}
