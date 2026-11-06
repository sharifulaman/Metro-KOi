import { Text as RNText } from 'react-native';

import { useSettings } from '@/store/settings';
import { fontFamily } from '@/theme/fonts';
import { BANGLA_LINE_FACTOR, typeScale, type Palette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import type { TextProps, TextTone } from './types';

const toneKey: Record<TextTone, keyof Palette> = {
  ink: 'ink',
  muted: 'inkMuted',
  brand: 'brand',
  danger: 'danger',
  inverse: 'inverse',
  onBrand: 'onBrand',
  live: 'onLiveTint',
  estimated: 'estimated',
};

export function Text({ variant = 'body', tone = 'ink', numeric, weight, align, numberOfLines, children, testID, accessibilityLabel }: TextProps) {
  const { c } = useTheme();
  const lang = useSettings((s) => s.lang);
  const ts = typeScale[variant];
  const w = weight ?? ts.weight;
  const lineHeight = lang === 'bn' ? Math.max(ts.line, Math.round(ts.size * BANGLA_LINE_FACTOR)) : ts.line;
  return (
    <RNText
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={1.3}
      style={{
        color: c[toneKey[tone]],
        fontSize: ts.size,
        lineHeight,
        fontFamily: fontFamily(lang, w, numeric || variant === 'countdown'),
        fontVariant: numeric || variant === 'countdown' ? ['tabular-nums'] : undefined,
        textAlign: align,
      }}
    >
      {children}
    </RNText>
  );
}

export type { TextProps, TextTone } from './types';
