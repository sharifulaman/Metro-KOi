import type { ReactNode } from 'react';

import type { SpaceStep } from '@/theme/tokens';

export interface CardProps {
  children: ReactNode;
  radius?: 'card' | 'hero';
  tone?: 'surface' | 'brand' | 'alt';
  padding?: SpaceStep;
  gap?: SpaceStep;
  elevated?: boolean;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}
