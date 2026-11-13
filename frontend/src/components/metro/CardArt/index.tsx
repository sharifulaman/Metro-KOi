import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { useSettings } from '@/store/settings';
import { fmtNum } from '@/lib/fmt';
import { fontFamily } from '@/theme/fonts';
import { cardChip, cardGradients } from '@/theme/tokens';

import type { CardArtProps } from './types';

// Native size the artwork is drawn at (a real card's ~1.58:1 ratio); the SVG
// viewBox scales it to whatever `width`/height the caller asks for.
const W = 326;
const H = 206;

const CONTACTLESS_D = [
  'M6 8.32a7.43 7.43 0 0 1 0 7.36',
  'M9.46 6.21a11.76 11.76 0 0 1 0 11.58',
  'M12.91 4.1a15.91 15.91 0 0 1 .01 15.8',
  'M16.37 2a20.16 20.16 0 0 1 0 20',
];

/** The saved-card visual: a gradient tile with a chip, a contactless mark and the card's label — used in the wallet carousel, list rows and the scan/save flow. */
export function CardArt({ name, tail, typeLabel, color, size = 'hero', width, testID }: CardArtProps) {
  const lang = useSettings((s) => s.lang);
  const id = useId().replace(/[:]/g, '_');
  const grad = cardGradients[color];
  const w = width ?? (size === 'hero' ? 310 : 104);
  const h = (w * H) / W;
  const hero = size === 'hero';
  return (
    <Svg testID={testID} width={w} height={h} viewBox={`0 0 ${W} ${H}`} accessibilityLabel={`${name}, ${typeLabel}`}>
      <Defs>
        <LinearGradient id={`g${id}`} x1="0%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor={grad.from} />
          <Stop offset="55%" stopColor={grad.via} />
          <Stop offset="100%" stopColor={grad.to} />
        </LinearGradient>
        <LinearGradient id={`chip${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={cardChip.from} />
          <Stop offset="100%" stopColor={cardChip.to} />
        </LinearGradient>
        <ClipPath id={`name${id}`}>
          <Rect x={18} y="62%" width={200} height={40} />
        </ClipPath>
      </Defs>

      <Rect x={0} y={0} width={W} height={H} rx={22} fill={`url(#g${id})`} />
      <Circle cx={276} cy={40} r={110} fill="#FFFFFF" opacity={0.08} />
      <Circle cx={216} cy={196} r={100} fill="#FFFFFF" opacity={0.05} />

      <Line x1={20} y1={107} x2={306} y2={107} stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={2} />
      {[20, 86, 152, 218, 284].map((x) => (
        <Circle key={x} cx={x + 5.5} cy={106.5} r={5.5} fill="#FFFFFF" opacity={0.55} />
      ))}

      <Rect x={18} y={13} width={128} height={20} rx={10} fill="#000000" opacity={0.3} />
      <SvgText x={28} y={27} fontSize={11} fontWeight="600" fontFamily={fontFamily(lang, 600)} fill="#FFFFFF">
        {typeLabel}
      </SvgText>

      <G transform="translate(282, 15) scale(1.17)">
        {CONTACTLESS_D.map((d) => (
          <Path key={d} d={d} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ))}
      </G>

      <Rect x={20} y={54} width={40} height={30} rx={6} fill={`url(#chip${id})`} stroke="#000000" strokeOpacity={0.2} strokeWidth={1} />

      {hero ? (
        <>
          <SvgText clipPath={`url(#name${id})`} x={20} y={188} fontSize={18} fontWeight="700" fontFamily={fontFamily(lang, 700)} fill="#FFFFFF">
            {name}
          </SvgText>
          <SvgText x={306} y={188} textAnchor="end" fontSize={15} fontWeight="600" fontFamily={fontFamily(lang, 600, true)} fill="#FFFFFF">
            {`•••• ${fmtNum(tail, lang)}`}
          </SvgText>
        </>
      ) : null}
    </Svg>
  );
}

export type { CardArtProps } from './types';
