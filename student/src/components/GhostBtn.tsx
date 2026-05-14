import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';

interface Props {
  label: string;
  onPress?: () => void;
  tone?: string;
  style?: ViewStyle;
}

export default function GhostBtn({ label, onPress, tone, style }: Props) {
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const color = tone ?? theme.accent;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.btn, { borderColor: color }, style]}
    >
      <Text style={[styles.label, { fontFamily: theme.fBodySemiBold, color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 16, letterSpacing: 0.3 },
});
