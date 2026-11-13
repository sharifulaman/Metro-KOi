import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { TabKey } from './types';

/** The five tab glyphs, traced from the design (one SVG each, 24-unit box). */
export function TabIcon({ name, color, size = 25 }: { name: TabKey; color: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'live':
      return (
        <Svg {...common}>
          <Path d="M3 15.6a9.4 9.4 0 1 1 18 0" strokeWidth={1.6} />
          <Path
            fill={color}
            stroke="none"
            fillRule="evenodd"
            d="M10.2 6.4h3.6a2.8 2.8 0 0 1 2.8 2.8v5.2a2.8 2.8 0 0 1-2.8 2.8h-3.6a2.8 2.8 0 0 1-2.8-2.8V9.2a2.8 2.8 0 0 1 2.8-2.8Z M9 8.4h6v3.4H9Z M9.9 14.4a.85.85 0 1 0 1.7 0 .85.85 0 1 0-1.7 0Z M12.4 14.4a.85.85 0 1 0 1.7 0 .85.85 0 1 0-1.7 0Z"
          />
          <Path d="M10 18.4 9 21M14 18.4l1 2.6M9.4 19.9h5.2" strokeWidth={1.4} />
        </Svg>
      );
    case 'stations':
      return (
        <Svg {...common}>
          <Path
            fill={color}
            stroke="none"
            fillRule="evenodd"
            d="M5.2 7.4h3.2a2.4 2.4 0 0 1 2.4 2.4v4.6a2.4 2.4 0 0 1-2.4 2.4H5.2a2.4 2.4 0 0 1-2.4-2.4V9.8a2.4 2.4 0 0 1 2.4-2.4Z M4.2 9h5.2v3H4.2Z M4 14.3a.8.8 0 1 0 1.6 0 .8.8 0 1 0-1.6 0Z M8 14.3a.8.8 0 1 0 1.6 0 .8.8 0 1 0-1.6 0Z"
          />
          <Path d="M4.4 18.4 3.6 20.4M9.2 18.4l.8 2M4.1 19.5h5.5" strokeWidth={1.4} />
          <Path d="M13.4 5.6 20.8 9.6V19.6" strokeWidth={1.8} />
          <Circle cx={16.4} cy={11} r={1.05} fill={color} stroke="none" />
          <Path d="M16.4 12.5v2.5m0 0-1.2 1.9m1.2-1.9 1.2 1.9" strokeWidth={1.3} />
          <Rect x={13.6} y={17.4} width={6} height={2.2} rx={0.4} fill={color} stroke="none" />
        </Svg>
      );
    case 'journey':
      return (
        <Svg {...common}>
          <Path fill={color} stroke="none" fillRule="evenodd" d="M5.2 2.6a3 3 0 1 0 0 6 3 3 0 1 0 0-6Z M4.3 3.9 6.7 5.6 4.3 7.3 3.7 6.6 5.3 5.6 3.7 4.6Z" />
          <Path d="M10.6 5.6h2.2M18.4 5.6a3.2 3.2 0 0 1 0 6.4h-3.6M8.8 12H6.8a3.2 3.2 0 0 0 0 6.4M12.8 18.4h1.6" strokeWidth={1.8} />
          <Circle cx={15.2} cy={5.6} r={1.35} fill={color} stroke="none" />
          <Circle cx={11.8} cy={12} r={1.35} fill={color} stroke="none" />
          <Circle cx={10} cy={18.4} r={1.35} fill={color} stroke="none" />
          <Circle cx={19.2} cy={18.4} r={2.8} strokeWidth={1.6} />
          <Circle cx={19.2} cy={18.4} r={1} fill={color} stroke="none" />
        </Svg>
      );
    case 'card':
      return (
        <Svg {...common}>
          <Rect x={3} y={5.5} width={18} height={13} rx={3.5} fill={color} fillOpacity={0.34} />
          <Rect x={6.2} y={9.4} width={3.6} height={3} rx={0.9} fill={color} stroke="none" />
          <Path d="M14.6 9.6a3.2 3.2 0 0 1 0 4.8M17.2 8a5.8 5.8 0 0 1 0 8" />
          <Path d="M6.4 15.6h3.4" />
        </Svg>
      );
    case 'more':
      return (
        <Svg {...common}>
          <Rect x={4} y={4} width={6.6} height={6.6} rx={2} fill={color} fillOpacity={0.16} strokeWidth={1.8} />
          <Rect x={13.4} y={4} width={6.6} height={6.6} rx={2} fill={color} stroke="none" />
          <Rect x={4} y={13.4} width={6.6} height={6.6} rx={2} fill={color} fillOpacity={0.16} strokeWidth={1.8} />
          <Rect x={13.4} y={13.4} width={6.6} height={6.6} rx={2} fill={color} fillOpacity={0.16} strokeWidth={1.8} />
        </Svg>
      );
  }
}
