import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../theme';

// The cinematic canvas: near-black with a warm ambient glow bleeding from the
// top, plus a soft vignette. Sits behind every screen.
export default function Backdrop({ tint = T.accent }: { tint?: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: T.bg }]} />
      {/* warm glow from top */}
      <LinearGradient
        colors={[tint + '26', tint + '08', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />
      {/* second, off-axis glow for depth */}
      <LinearGradient
        colors={['transparent', 'rgba(255,46,139,0.10)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      {/* bottom vignette */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
