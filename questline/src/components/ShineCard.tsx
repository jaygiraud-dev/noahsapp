import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../theme';

// Large-radius rounded card with a soft top shine and a hairline edge.
export default function ShineCard({
  children,
  style,
  glow,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  glow?: string;
}) {
  return (
    <View
      style={[
        styles.base,
        glow ? { shadowColor: glow, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } } : null,
        style,
      ]}
    >
      {children}
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.shine}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.surfaceEdge,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
});
