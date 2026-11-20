import type { CardColor } from '@/theme/tokens';

export interface ManualCardViewProps {
  title: string;
  closeLabel: string;
  onClose(): void;
  preview: { name: string; tail: string; typeLabel: string; rapidPass?: boolean };
  nameLabel: string;
  name: string;
  onName(v: string): void;
  tailLabel: string;
  tail: string;
  onTail(v: string): void;
  colorLabel: string;
  color: CardColor;
  onColor(c: CardColor): void;
  colorLabels: Record<CardColor, string>;
  note: string;
  saveLabel: string;
  canSave: boolean;
  onSave(): void;
  /** secondary "scan to save" button; omit when editing a saved card */
  scanLabel?: string;
  onScan?(): void;
  testID?: string;
}
