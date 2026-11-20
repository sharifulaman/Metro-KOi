import { Children, type ReactNode } from 'react';
import { Text as RNText } from 'react-native';

import { useSettings } from '@/store/settings';
import { bnSize, fontFamily, hasBengali } from '@/theme/fonts';
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

/** The plain text of a node: strings and numbers only (enough to tell which script is shown). */
function plainText(children: ReactNode): string {
  let out = '';
  Children.forEach(children, (ch) => {
    if (typeof ch === 'string' || typeof ch === 'number') out += ch;
  });
  return out;
}

export function Text({ variant = 'body', tone = 'ink', numeric, weight, size, lh, tracking, color, align, numberOfLines, children, testID, accessibilityLabel }: TextProps) {
  const { c } = useTheme();
  const lang = useSettings((s) => s.lang);
  const ts = typeScale[variant];
  const w = weight ?? ts.weight;
  const text = plainText(children);
  // Bangla app, or Bangla text inside the English app (station names, names typed by the user)
  const bangla = lang === 'bn' || hasBengali(text);
  const base = size ?? ts.size;
  const fs = bangla ? bnSize(base) : base;
  const lineHeight = bangla
    ? Math.round(fs * Math.max(BANGLA_LINE_FACTOR, lh ?? 0, 1.4))
    : lh != null
      ? Math.round(fs * lh)
      : size != null
        ? Math.round(fs * 1.35)
        : ts.line;
  return (
    <RNText
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={1.3}
      style={{
        color: color ?? c[toneKey[tone]],
        fontSize: fs,
        letterSpacing: tracking,
        lineHeight,
        fontFamily: fontFamily(lang, w, numeric || variant === 'countdown', text),
        fontVariant: numeric || variant === 'countdown' ? ['tabular-nums'] : undefined,
        textAlign: align,
      }}
    >
      {children}
    </RNText>
  );
}

export type { TextProps, TextTone } from './types';
