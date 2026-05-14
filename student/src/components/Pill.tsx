import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';

interface Props {
  label: string;
  active?: boolean;
  tone?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function Pill({ label, active, tone, onPress, style }: Props) {
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const color = tone ?? theme.accent;

  return (
    <TouchableOpacity
      style={[
        styles.pill,
        { borderColor: active ? color : theme.line, backgroundColor: active ? color + '22' : 'transparent' },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          { fontFamily: theme.fMono, color: active ? color : theme.soft },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
