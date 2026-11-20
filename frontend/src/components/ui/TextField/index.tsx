import { TextInput, View } from 'react-native';

import { useSettings } from '@/store/settings';
import { fontFamily } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

import { Text } from '../Text';

import type { TextFieldProps } from './types';

/** Labelled single-line text entry (spec: Card section redesign — naming and editing a saved card). */
export function TextField({ label, value, onChangeText, placeholder, maxLength, keyboardType = 'default', autoFocus, testID, accessibilityLabel }: TextFieldProps) {
  const { c, radius, space } = useTheme();
  const lang = useSettings((s) => s.lang);
  return (
    <View>
      {label ? (
        <Text size={13} lh={1.4} tone="muted" weight={600}>
          {label}
        </Text>
      ) : null}
      <TextInput
        testID={testID}
        accessibilityLabel={accessibilityLabel ?? label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.inkMuted}
        maxLength={maxLength}
        keyboardType={keyboardType === 'numeric' ? 'number-pad' : 'default'}
        autoFocus={autoFocus}
        selectionColor={c.brand}
        style={{
          marginTop: 6,
          height: 50,
          paddingHorizontal: space[4],
          borderRadius: radius.tile + 4,
          borderWidth: 1.5,
          borderColor: c.outline,
          backgroundColor: c.surfaceAlt,
          color: c.ink,
          fontSize: 16,
          fontFamily: fontFamily(lang, 400, false, value ?? placeholder),
        }}
      />
    </View>
  );
}

export type { TextFieldProps } from './types';
