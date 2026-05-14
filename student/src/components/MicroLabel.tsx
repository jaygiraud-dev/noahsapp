import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';

interface Props {
  children: React.ReactNode;
  color?: string;
  style?: TextStyle;
}

export default function MicroLabel({ children, color, style }: Props) {
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  return (
    <Text
      style={[
        styles.text,
        { fontFamily: theme.fMono, color: color ?? theme.soft },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
