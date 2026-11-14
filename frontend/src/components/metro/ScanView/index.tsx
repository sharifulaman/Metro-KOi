import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { CardArt } from '../CardArt';
import { NavHeader } from '../NavHeader';

import type { ScanViewProps } from './types';

/** Hold-the-card screen (design ২): rings, a phone with its NFC mark, the card tilting in, two platform hints. */
export function ScanView(p: ScanViewProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <NavHeader left={{ icon: 'close', label: p.closeLabel, onPress: p.onClose }} title={p.title} />

      {/* the 390-wide stage the illustration was drawn on, centred */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
        <View style={{ width: 390, height: 460, marginTop: insets.top }}>
          <Svg width={390} height={460} style={{ position: 'absolute' }}>
            <Circle cx={195} cy={270} r={169} stroke={c.brand} strokeWidth={2} fill="none" opacity={0.14} />
            <Circle cx={195} cy={270} r={133} stroke={c.brand} strokeWidth={2} fill="none" opacity={0.24} />
            <Circle cx={195} cy={270} r={99} stroke={c.brand} strokeWidth={2} fill="none" opacity={0.4} />
          </Svg>
          <View style={{ position: 'absolute', left: 113, top: 128, width: 164, height: 290, borderRadius: 30, boxShadow: '0 14px 30px rgba(14,26,22,0.3)', overflow: 'hidden' }}>
            <Svg width={164} height={290}>
              <Defs>
                <LinearGradient id="phone" x1="30%" y1="0%" x2="70%" y2="100%">
                  <Stop offset="0%" stopColor="#2B3A35" />
                  <Stop offset="100%" stopColor="#0E1A16" />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={164} height={290} fill="url(#phone)" />
            </Svg>
            <View style={{ position: 'absolute', left: 14, top: 14, width: 46, height: 46, borderRadius: 14, backgroundColor: '#0B1210', borderWidth: 2, borderColor: '#3A4A44' }}>
              <View style={{ position: 'absolute', left: 10, top: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#1A2723', borderWidth: 2, borderColor: '#4A5E57' }} />
            </View>
            <View style={{ position: 'absolute', left: 50, top: 112, width: 64, height: 64, borderRadius: 32, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="nfc" size={34} color="#04140E" strokeWidth={2.2} />
            </View>
          </View>
          <View style={{ position: 'absolute', left: 201, top: 318, transform: [{ rotate: '-14deg' }] }}>
            <CardArt name={p.card.name} tail={p.card.tail} typeLabel={p.card.typeLabel} color="green" width={163} />
          </View>
        </View>
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, top: 446 + insets.top, alignItems: 'center', paddingHorizontal: 32 }}>
        <Text size={24} lh={1.3} weight={700} align="center">
          {p.heading}
        </Text>
        <View style={{ marginTop: 6 }}>
          <Text size={15} lh={1.5} weight={400} tone="muted" align="center">
            {p.hint}
          </Text>
        </View>
      </View>

      <View style={{ position: 'absolute', left: 24, right: 24, top: 576 + insets.top, gap: 8 }}>
        {[
          { icon: 'phone' as const, text: p.androidHint },
          { icon: 'shieldPlain' as const, text: p.iosHint },
        ].map((h) => (
          <View key={h.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: c.surfaceAlt }}>
            <Icon name={h.icon} size={20} color={c.onBrandTint} />
            <View style={{ flex: 1 }}>
              <Text size={13.5} lh={1.4} weight={400}>
                {h.text}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 28 + insets.bottom, gap: 8 }}>
        {p.error ? (
          <Text size={13.5} lh={1.4} weight={600} tone="danger" align="center" testID="scan-error">
            {p.error}
          </Text>
        ) : null}
        {p.error ? <Button label={p.retryLabel} icon="nfc" fullWidth onPress={p.onRetry} /> : null}
        <Button label={p.cancelLabel} variant="secondary" fullWidth onPress={p.onClose} />
      </View>
    </View>
  );
}

export type { ScanViewProps } from './types';
