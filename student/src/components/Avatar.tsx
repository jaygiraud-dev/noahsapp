import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  uri?: string | null;
  name: string;
  size?: number;
  colors: readonly [string, string] | string[];
  fontFamily?: string;
}

/** Profile photo, or the first letter of the name on a gradient. */
export default function Avatar({ uri, name, size = 48, colors, fontFamily }: Props) {
  const r = size / 2;
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: r }} accessibilityLabel={`${name}'s photo`} />;
  }
  return (
    <LinearGradient
      colors={colors as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.circle, { width: size, height: size, borderRadius: r }]}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.5, fontFamily }}>{(name || '?').charAt(0).toUpperCase()}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center' },
});
