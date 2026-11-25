export interface ObWelcomeViewProps {
  title: string;
  body: string;
  /** station pills at the two ends of the drawn line */
  fromLabel: string;
  toLabel: string;
  /** chip beside the train ("arriving in 3 min") */
  etaLabel: string;
  /** badge in the illustration's corner */
  liveLabel: string;
  nextLabel: string;
  skipLabel: string;
  onNext(): void;
  onSkip(): void;
  progress?: { index: number; count: number };
  testID?: string;
}
