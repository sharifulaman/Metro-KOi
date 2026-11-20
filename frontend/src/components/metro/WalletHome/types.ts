import type { CardColor } from '@/theme/tokens';

export interface WalletHomeCard {
  id: string;
  name: string;
  tail: string;
  typeLabel: string;
  color: CardColor;
  rapidPass?: boolean;
}

export interface WalletHomeTrip {
  id: string;
  kind: 'trip' | 'recharge';
  title: string;
  /** "আজ ০৮:১২" */
  when: string;
  /** signed amount, already formatted ("−৳ ৪০") */
  amount: string;
}

export interface WalletHomeBalance {
  label: string;
  badgeLabel: string;
  badgeTone: 'brand' | 'neutral';
  /** digits only ("৩৪০"); null → the "no balance info" state */
  amount: string | null;
  caption: string;
  noInfoTitle: string;
}

export interface WalletHomeProps {
  title: string;
  subtitle: string;
  addLabel: string;
  savedLabel: string;
  viewAllLabel: string;
  cards: WalletHomeCard[];
  index: number;
  onIndexChange(index: number): void;
  balance: WalletHomeBalance;
  scanLabel: string;
  historyLabel: string;
  editLabel: string;
  recentLabel: string;
  recent: WalletHomeTrip[];
  onAdd(): void;
  onViewAll(): void;
  onScan(): void;
  onHistory(): void;
  onEdit(): void;
  testID?: string;
}
