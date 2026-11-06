import { Circle, G, Path } from 'react-native-svg';

import type { Direction, TrainState } from '@/models';
import { useTheme } from '@/theme/useTheme';

export interface TrainMarkerProps {
  x: number;
  y: number;
  /** degrees, 0 = up */
  bearing: number;
  dir: Direction;
  state: TrainState;
  selected?: boolean;
  /** offset so SB/NB trains don't overlap on the single drawn line */
  offset?: number;
  onPress?: () => void;
}

/** Arrow in the direction colour; LIVE ring; dashed when estimated/stale (spec §9.4 map/). */
export function TrainMarker({ x, y, bearing, dir, state, selected, offset = 9, onPress }: TrainMarkerProps) {
  const { c } = useTheme();
  const color = dir === 'SB' ? c.trainSB : c.trainNB;
  const rad = (bearing * Math.PI) / 180;
  // perpendicular offset: SB to the right of travel, NB to the left
  const side = dir === 'SB' ? 1 : -1;
  const ox = x + Math.cos(rad) * offset * side;
  const oy = y + Math.sin(rad) * offset * side;
  const heading = dir === 'SB' ? bearing : bearing + 180;
  const dashed = state !== 'LIVE';
  return (
    <G onPress={onPress} transform={`translate(${ox},${oy})`}>
      <Circle r={22} fill="transparent" />
      {state === 'LIVE' && <Circle r={15} fill={c.live} opacity={0.25} />}
      {selected && <Circle r={17} fill="none" stroke={c.ink} strokeWidth={2} />}
      <G rotation={heading}>
        <Path
          d="M0,-11 L8,8 L0,4 L-8,8 Z"
          fill={dashed ? c.surface : color}
          stroke={dashed ? c.estimated : c.surface}
          strokeWidth={2}
          strokeDasharray={dashed ? '3,2' : undefined}
          strokeLinejoin="round"
        />
      </G>
    </G>
  );
}
