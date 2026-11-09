import { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { Direction, TrainState } from '@/models';
import { useSettings } from '@/store/settings';
import { fontFamily } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

import { svgPress } from '../svgPress';

export interface TrainMarkerProps {
  x: number;
  y: number;
  /** degrees, 0 = up */
  bearing: number;
  dir: Direction;
  state: TrainState;
  selected?: boolean;
  /** tag shown above a selected train, e.g. "T-17 · Live" */
  label?: string;
  /** viewBox units per screen pixel (sizes below are in screen px) */
  k?: number;
  /** whole-line overview: a short train without windows */
  dense?: boolean;
  onPress?: () => void;
}

/**
 * A small train in the direction colour pointing the way it travels (board 1).
 * LIVE: filled with an amber ring. Estimated/stale: white with a dashed outline.
 * SB runs on the right of travel, NB on the left, so the two never overlap.
 */
export function TrainMarker({ x, y, bearing, dir, state, selected, label, k = 1, dense, onPress }: TrainMarkerProps) {
  const { c } = useTheme();
  const lang = useSettings((s) => s.lang);
  const color = dir === 'SB' ? c.trainSB : c.trainNB;
  const L = dense ? 24 : 54;
  const H = dense ? 10 : 17;
  const offset = (dense ? 7 : 12) * k;
  const rad = (bearing * Math.PI) / 180;
  const side = dir === 'SB' ? 1 : -1;
  const ox = x + Math.cos(rad) * offset * side;
  const oy = y + Math.sin(rad) * offset * side;
  // the body is drawn along +x; rotate so +x points the way the train travels
  const heading = (dir === 'SB' ? bearing : bearing + 180) - 90;
  const live = state === 'LIVE';
  const tagW = label ? label.length * 7 + 20 : 0;
  return (
    <G {...svgPress(onPress)} transform={`translate(${ox},${oy}) scale(${k})`}>
      <Circle r={L / 2 + 6} fill="transparent" />
      {live && <Circle r={L / 2 + 2} fill="none" stroke={c.live} strokeWidth={2.5} opacity={0.65} />}
      {selected && <Circle r={L / 2 + 5} fill="none" stroke={c.ink} strokeWidth={2} />}
      <G transform={`rotate(${heading})`}>
        <Rect
          x={-L / 2}
          y={-H / 2}
          width={L}
          height={H}
          rx={H / 2.8}
          fill={live ? color : c.surface}
          fillOpacity={live ? 1 : 0.92}
          stroke={live ? c.surface : color}
          strokeWidth={live ? 3 : 2}
          strokeDasharray={live ? undefined : '5,3'}
        />
        {!dense &&
          [-21, -7, 7].map((wx) => <Rect key={wx} x={wx} y={-3} width={10} height={6} rx={1.5} fill={live ? c.surface : color} opacity={live ? 0.8 : 0.35} />)}
        <Path d={`M${L / 2 - (dense ? 7 : 8)},${dense ? -3 : -4} L${L / 2 - 2},0 L${L / 2 - (dense ? 7 : 8)},${dense ? 3 : 4} Z`} fill={live ? c.surface : color} />
      </G>
      {label ? (
        <G transform={`translate(0,${-(L / 2 + 18)})`}>
          <Rect x={-tagW / 2} y={-12} width={tagW} height={24} rx={12} fill={c.surface} stroke={c.divider} strokeWidth={1} />
          <Circle cx={-tagW / 2 + 11} cy={0} r={4} fill={live ? c.live : color} />
          <SvgText x={6} y={4.5} fontSize={12} fontWeight="700" fontFamily={fontFamily(lang, 700)} fill={c.ink} textAnchor="middle">
            {label}
          </SvgText>
        </G>
      ) : null}
    </G>
  );
}
