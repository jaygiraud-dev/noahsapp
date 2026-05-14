import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';

interface Props {
  children: React.ReactNode;
  size?: number;
  color?: string;
  italic?: boolean;
  style?: TextStyle;
}

export default function SerifTitle({ children, size = 32, color, italic = true, style }: Props) {
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  return (
    <Text
      style={[
        styles.text,
        {
          fontFamily: italic ? theme.fDisplayItalic : theme.fDisplay,
          fontSize: size,
          color: color ?? theme.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { lineHeight: 40 },
});
