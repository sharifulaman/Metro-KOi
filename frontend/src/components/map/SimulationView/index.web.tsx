import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import html from '@/data/simHtml';
import { useTheme } from '@/theme/useTheme';

import { tripScript, type SimulationViewProps } from './tripScript';

/** Web build: the same simulation page in a same-origin iframe (srcdoc). */
export function SimulationView({ fromIdx, toIdx, testID }: SimulationViewProps) {
  const { c } = useTheme();
  const frame = useRef<HTMLIFrameElement | null>(null);

  const pick = () => {
    const w = frame.current?.contentWindow as (Window & { eval(code: string): unknown }) | null | undefined;
    try {
      w?.eval(tripScript(fromIdx, toIdx));
    } catch {
      // page not ready yet; onLoad runs it again
    }
  };
  useEffect(pick, [fromIdx, toIdx]);

  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <iframe ref={frame} title="Metro Koi 3D" srcDoc={html} onLoad={pick} style={{ border: 0, width: '100%', height: '100%', display: 'block' }} />
    </View>
  );
}

export type { SimulationViewProps } from './tripScript';
