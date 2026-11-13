export interface BalancePanelProps {
  /** small heading, e.g. "Current balance" */
  label: string;
  /** pill text: "Read from card" when balanceBdt is known, "History only" when it isn't */
  badgeLabel: string;
  badgeTone: 'brand' | 'neutral';
  balanceBdt: number | null;
  /** last-tap line when balanceBdt is known; explanatory body text when it is null */
  caption: string;
  /** shown instead of the amount when balanceBdt is null, e.g. "No balance info" */
  noInfoLabel: string;
  testID?: string;
}
