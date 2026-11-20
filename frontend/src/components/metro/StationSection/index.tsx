import { View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useSettings } from '@/store/settings';
import { fontFamily } from '@/theme/fonts';
import { livery } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import type { StationSectionProps } from './types';

/**
 * Side elevation of an elevated Line-6 station: street → concourse → platforms.
 * Used by the Inside-route screen and as the 2D fallback for the 3D scene.
 */
export function StationSection({ platform = 1, gate = 'A', mode = 'entry', trainAt = null, roofOpen = true, labels, testID }: StationSectionProps) {
  const { c, radius } = useTheme();
  const lang = useSettings((s) => s.lang);
  // taller phones get a taller diagram (same drawing, centred), so the page does not end in an empty band
  const { height: winH } = useWindowDimensions();
  const height = Math.round(Math.min(Math.max(240, winH * 0.34), 400));
  const west = gate === 'A' || gate === 'C';
  const gx = west ? 40 : 300;
  const px = platform === 1 ? 230 : 110;
  // route: gate (street) → stairs → concourse → stairs → platform
  const route = `M${gx},220 L${gx},200 L${west ? 90 : 250},200 L${west ? 120 : 220},150 L170,150 L${px},150 L${px},90 L${px},72`;
  const font = fontFamily(lang, 600);
  return (
    <View testID={testID} style={{ borderRadius: radius.card, overflow: 'hidden', backgroundColor: c.mapGround }}>
      <Svg width="100%" height={height} viewBox="0 0 340 240">
        {/* street + piers */}
        <Rect x={0} y={220} width={340} height={20} fill={c.mapRoad} />
        <Rect x={95} y={160} width={14} height={60} fill={c.outline} />
        <Rect x={231} y={160} width={14} height={60} fill={c.outline} />
        {/* concourse (brick-red facade) */}
        <Rect x={60} y={130} width={220} height={30} rx={4} fill={c.facade} opacity={0.9} />
        <SvgText x={170} y={150} fontSize={11} fontFamily={font} fill={c.onBrand} textAnchor="middle">
          {labels.concourse}
        </SvgText>
        {/* platforms */}
        <Rect x={50} y={88} width={240} height={10} fill={c.surface} stroke={c.outline} />
        {/* trains */}
        {trainAt ? (
          <G>
            <Rect x={trainAt === 1 ? 175 : 55} y={56} width={110} height={30} rx={6} fill={livery.body} stroke={livery.underframe} strokeWidth={1} />
            <Rect x={trainAt === 1 ? 175 : 55} y={76} width={110} height={4} fill={livery.stripe} />
            <Rect x={trainAt === 1 ? 175 : 55} y={80} width={110} height={3} fill={livery.band} />
          </G>
        ) : null}
        {/* two rows so long labels never collide */}
        <SvgText x={52} y={111} fontSize={10.5} fontFamily={font} fill={platform === 2 ? c.ink : c.inkMuted} textAnchor="start">
          {labels.platform2}
        </SvgText>
        <SvgText x={288} y={124} fontSize={10.5} fontFamily={font} fill={platform === 1 ? c.ink : c.inkMuted} textAnchor="end">
          {labels.platform1}
        </SvgText>
        {/* roof (vault) */}
        {!roofOpen && <Path d="M40,88 Q170,0 300,88 Z" fill={c.brand} opacity={0.35} />}
        {/* route */}
        <Path d={route} stroke={c.brandDeep} strokeWidth={3} strokeDasharray="6,5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={mode === 'entry' ? gx : px} cy={mode === 'entry' ? 220 : 72} r={6} fill={c.brandDeep} />
        <Circle cx={mode === 'entry' ? px : gx} cy={mode === 'entry' ? 72 : 220} r={6} fill={c.surface} stroke={c.brandDeep} strokeWidth={3} />
        <SvgText x={gx} y={236} fontSize={12} fontWeight="700" fill={c.ink} textAnchor="middle">
          {gate}
        </SvgText>
        <SvgText x={170} y={236} fontSize={10} fontFamily={font} fill={c.inkMuted} textAnchor="middle">
          {labels.street}
        </SvgText>
      </Svg>
    </View>
  );
}

export type { StationSectionProps } from './types';
