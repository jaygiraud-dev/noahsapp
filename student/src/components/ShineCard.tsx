import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export default function ShineCard({ style, children }: Props) {
  return (
    <View style={[styles.base, style]}>
      {children}
      <LinearGradient
        colors={['rgba(255,255,255,0.11)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.shine}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
  },
});
