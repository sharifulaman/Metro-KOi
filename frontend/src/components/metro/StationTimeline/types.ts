export interface TimelineEta {
  /** "4 min", "6:30" — already formatted */
  label: string;
  /** live = amber pill with dot; schedule = grey pill with dashed dot; closed = grey pill with a clock */
  kind: 'live' | 'schedule' | 'closed';
}

export interface TimelineStation {
  id: string;
  /** "১" / "11" */
  order: string;
  name: string;
  altName: string;
  terminal?: 'start' | 'end';
  eta?: TimelineEta;
  onPress?: () => void;
}

export interface StationTimelineProps {
  stations: TimelineStation[];
  /** a train between two rows: index of the row it last left (in list order) and 0..1 progress to the next */
  train?: { afterIndex: number; progress: number; live: boolean };
  labels: { start: string; end: string };
  testID?: string;
}
