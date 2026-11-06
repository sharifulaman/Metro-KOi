import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { livery } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { crowdLevel } from '../CoachCrowdBar/types';

import type { TrainIllustrationProps } from './types';

const CAR_W = 86;
const H = 46;

/** Side view in the Line-6 livery (our own art, spec §9.1). */
export function TrainIllustration({ cars = 6, direction = 'SB', crowd, width = 320, testID }: TrainIllustrationProps) {
  const { c } = useTheme();
  const W = cars * CAR_W + 8;
  const crowdColor = { low: c.crowdLow, mid: c.crowdMid, high: c.crowdHigh };
  return (
    <Svg testID={testID} width={width} height={(width * (H + 10)) / W} viewBox={`0 0 ${W} ${H + 10}`}>
      <G transform={direction === 'NB' ? `translate(${W},0) scale(-1,1)` : undefined}>
        {Array.from({ length: cars }, (_, i) => {
          const x = 4 + i * CAR_W;
          const isCab = i === cars - 1;
          const body = isCab ? `M${x},8 H${x + CAR_W - 22} Q${x + CAR_W - 2},10 ${x + CAR_W - 2},30 V40 H${x} Z` : `M${x},8 H${x + CAR_W - 3} V40 H${x} Z`;
          const level = crowd?.[i] != null ? crowdLevel(crowd[i]) : null;
          return (
            <G key={i}>
              <Path d={body} fill={livery.body} stroke={livery.underframe} strokeWidth={0.8} />
              <Rect x={x} y={30} width={CAR_W - (isCab ? 2 : 3)} height={3.5} fill={livery.stripe} />
              <Rect x={x} y={33.5} width={CAR_W - (isCab ? 2 : 3)} height={2.5} fill={livery.band} />
              {[0, 1, 2].map((w) => (
                <Rect key={w} x={x + 8 + w * 20} y={14} width={14} height={11} rx={2} fill={level ? crowdColor[level] : livery.glass} opacity={level ? 0.85 : 1} />
              ))}
              {isCab && <Path d={`M${x + CAR_W - 20},12 Q${x + CAR_W - 6},13 ${x + CAR_W - 5},26 H${x + CAR_W - 20} Z`} fill={livery.cab} />}
              <Rect x={x + 2} y={40} width={CAR_W - 7} height={4} fill={livery.underframe} />
              <Circle cx={x + 16} cy={47} r={4} fill={livery.underframe} />
              <Circle cx={x + CAR_W - 20} cy={47} r={4} fill={livery.underframe} />
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

export type { TrainIllustrationProps } from './types';
