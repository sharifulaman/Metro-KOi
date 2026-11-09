export interface PlaybackBarProps {
  /** "Timetable playback", already translated */
  title: string;
  /** current virtual time, e.g. "সকাল ৭:১২ · শনিবার" */
  timeLabel: string;
  rates: { value: number; label: string }[];
  rate: number;
  onRate(rate: number): void;
  onClose(): void;
  closeLabel: string;
  testID?: string;
}
