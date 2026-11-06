import { useColorScheme } from 'react-native';

import { useSettings } from '@/store/settings';

import { dark, light, radius, shadow, size, space, type Palette } from './tokens';

export interface Theme {
  c: Palette;
  dark: boolean;
  space: typeof space;
  radius: typeof radius;
  size: typeof size;
  shadow: typeof shadow;
}

export function useTheme(): Theme {
  const mode = useSettings((s) => s.themeMode);
  const system = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return { c: isDark ? dark : light, dark: isDark, space, radius, size, shadow };
}
