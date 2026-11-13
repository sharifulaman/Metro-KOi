export interface EtaTile {
  /** "Now", "~9 min" */
  value: string;
  /** "Live" / "Estimated" */
  caption: string;
  live?: boolean;
}

export interface DirectionEtaCardProps {
  /** "To Motijheel" */
  title: string;
  /** "Platform 1" */
  platformLabel: string;
  /** up to three next trains; the first is shown larger. Empty = `emptyText`. */
  tiles: EtaTile[];
  emptyText: string;
  testID?: string;
}
