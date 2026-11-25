import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import type { Lang, ThemeMode } from '@/models';
import { dark as darkPalette, light as lightPalette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { TopBar } from '../ObWelcomeView';

import type { ObPrefsViewProps } from './types';

/** Onboarding page 2 (design: language and theme): big language cards, theme cards with a tiny preview of each. */
export function ObPrefsView(p: ObPrefsViewProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const L = p.labels;

  const langCard = (value: Lang, glyph: string, name: string, sub: string) => {
    const on = p.lang === value;
    return (
      <Pressable
        key={value}
        onPress={() => p.onLang(value)}
        accessibilityRole="radio"
        accessibilityState={{ selected: on }}
        accessibilityLabel={name}
        style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 14, borderRadius: 22, backgroundColor: c.surface, borderWidth: on ? 2 : 1.5, borderColor: on ? c.brand : c.outline }}
        testID={`ob-lang-${value}`}
      >
        {on ? (
          <View style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: c.brandSolid, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={14} color={c.onBrandSolid} strokeWidth={3} />
          </View>
        ) : null}
        <Text size={34} lh={1.1} weight={700} color={on ? c.brand : c.inkMuted}>
          {glyph}
        </Text>
        <View style={{ marginTop: 8 }}>
          <Text size={16} lh={1.3} weight={700}>
            {name}
          </Text>
          <Text size={12.5} lh={1.4} tone="muted">
            {sub}
          </Text>
        </View>
      </Pressable>
    );
  };

  const themeCard = (value: ThemeMode, name: string) => {
    const on = p.theme === value;
    // the preview always shows the theme it stands for, whatever theme is on now
    const pal = value === 'dark' ? darkPalette : lightPalette;
    return (
      <Pressable
        key={value}
        onPress={() => p.onTheme(value)}
        accessibilityRole="radio"
        accessibilityState={{ selected: on }}
        accessibilityLabel={name}
        style={{ flex: 1, padding: 8, borderRadius: 20, backgroundColor: c.surface, borderWidth: on ? 2 : 1.5, borderColor: on ? c.brand : c.outline }}
        testID={`ob-theme-${value}`}
      >
        <View style={{ height: 78, borderRadius: 12, overflow: 'hidden', backgroundColor: pal.bg }}>
          {value === 'system' ? <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', right: 0, backgroundColor: darkPalette.bg }} /> : null}
          <View style={{ position: 'absolute', left: 8, right: 8, top: 12, height: 8, borderRadius: 4, backgroundColor: pal.outline }} />
          <View style={{ position: 'absolute', left: 8, width: 36, top: 28, height: 6, borderRadius: 3, backgroundColor: pal.ink, opacity: 0.5 }} />
          <View style={{ position: 'absolute', left: 8, right: 8, bottom: 10, height: 14, borderRadius: 7, backgroundColor: darkPalette.brand }} />
        </View>
        <View style={{ marginTop: 8 }}>
          <Text size={14} lh={1.3} weight={on ? 700 : 600} tone={on ? 'ink' : 'muted'} align="center">
            {name}
          </Text>
        </View>
      </Pressable>
    );
  };

  const section = (label: string) => (
    <View style={{ marginTop: 26, marginBottom: 10, marginHorizontal: 24 }}>
      <Text size={13.5} weight={700} tone="muted">
        {label}
      </Text>
    </View>
  );

  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 26, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <TopBar progress={p.progress} />
        <View style={{ marginTop: 26, marginHorizontal: 24 }}>
          <Text size={28} lh={1.3} weight={700} tracking={-0.3}>
            {p.title}
          </Text>
        </View>
        <View style={{ marginTop: 8, marginHorizontal: 24 }}>
          <Text size={15} lh={1.55} tone="muted">
            {p.body}
          </Text>
        </View>

        {section(L.language)}
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 12, marginHorizontal: 20 }}>
          {langCard('bn', 'আ', L.bangla, L.banglaSub)}
          {langCard('en', 'A', L.english, L.englishSub)}
        </View>

        {section(L.theme)}
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20 }}>
          {themeCard('system', L.system)}
          {themeCard('light', L.light)}
          {themeCard('dark', L.dark)}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginHorizontal: 24 }}>
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={c.brand} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <Rect x={7} y={2} width={10} height={20} rx={2.5} />
            <Path d="M11 18h2" />
          </Svg>
          <View style={{ flex: 1 }}>
            <Text size={12.5} lh={1.45} tone="muted">
              {L.systemNote}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 30 }}>
        <Button label={p.nextLabel} fullWidth height={56} onPress={p.onNext} testID="prefs-next" />
      </View>
    </View>
  );
}

export type { ObPrefsViewProps } from './types';
