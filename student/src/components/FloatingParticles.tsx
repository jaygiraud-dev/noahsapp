import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

interface Particle {
  id: number;
  startX: number;   // 0–1 fraction of screen width
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  driftX: number;   // horizontal drift in px (negative = left, positive = right)
  shape: 'circle' | 'diamond' | 'leaf';
}

const PARTICLES: Particle[] = [
  // Large embers / leaves — clearly visible
  { id: 0,  startX: 0.12, size: 9,  duration: 7000,  delay: 0,    opacity: 0.55, driftX: -40,  shape: 'diamond' },
  { id: 1,  startX: 0.80, size: 7,  duration: 8500,  delay: 1200, opacity: 0.45, driftX: -60,  shape: 'leaf' },
  { id: 2,  startX: 0.45, size: 11, duration: 9500,  delay: 2800, opacity: 0.40, driftX: -30,  shape: 'diamond' },
  { id: 3,  startX: 0.65, size: 6,  duration: 6500,  delay: 500,  opacity: 0.50, driftX: -50,  shape: 'circle' },
  { id: 4,  startX: 0.28, size: 8,  duration: 10000, delay: 3500, opacity: 0.42, driftX: -70,  shape: 'leaf' },
  { id: 5,  startX: 0.90, size: 5,  duration: 7500,  delay: 4200, opacity: 0.48, driftX: -45,  shape: 'diamond' },
  // Medium particles
  { id: 6,  startX: 0.05, size: 5,  duration: 8000,  delay: 6000, opacity: 0.38, driftX: -35,  shape: 'circle' },
  { id: 7,  startX: 0.55, size: 7,  duration: 11000, delay: 700,  opacity: 0.35, driftX: -55,  shape: 'diamond' },
  { id: 8,  startX: 0.38, size: 6,  duration: 9000,  delay: 5000, opacity: 0.40, driftX: -25,  shape: 'leaf' },
  { id: 9,  startX: 0.72, size: 9,  duration: 7800,  delay: 2200, opacity: 0.44, driftX: -65,  shape: 'diamond' },
  // Small drifters
  { id: 10, startX: 0.20, size: 4,  duration: 6000,  delay: 3000, opacity: 0.50, driftX: -20,  shape: 'circle' },
  { id: 11, startX: 0.85, size: 4,  duration: 12000, delay: 8000, opacity: 0.36, driftX: -40,  shape: 'circle' },
  { id: 12, startX: 0.50, size: 5,  duration: 8200,  delay: 1800, opacity: 0.42, driftX: -30,  shape: 'diamond' },
  { id: 13, startX: 0.33, size: 10, duration: 10500, delay: 6500, opacity: 0.38, driftX: -60,  shape: 'leaf' },
  { id: 14, startX: 0.95, size: 6,  duration: 7200,  delay: 4800, opacity: 0.46, driftX: -50,  shape: 'circle' },
  { id: 15, startX: 0.60, size: 8,  duration: 9800,  delay: 300,  opacity: 0.40, driftX: -45,  shape: 'diamond' },
];

function ParticleDot({ p, color }: { p: Particle; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      progress.setValue(0);
      rotation.setValue(0);
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration: p.duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 1,
          duration: p.duration,
          useNativeDriver: true,
        }),
      ]).start(() => loop());
    };
    const t = setTimeout(loop, p.delay);
    return () => clearTimeout(t);
  }, []);

  // Rise from below screen to above screen
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [H + 20, -120],
  });

  // Drift sideways with sine-like S-curve via multiple keyframes
  const translateX = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      0,
      p.driftX * 0.3,
      p.driftX * 0.6,
      p.driftX * 0.8,
      p.driftX,
    ],
  });

  // Fade in then out
  const opacity = progress.interpolate({
    inputRange: [0, 0.12, 0.75, 1],
    outputRange: [0, p.opacity, p.opacity, 0],
  });

  // Spin/flutter for leaf + diamond shapes
  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: p.shape === 'circle' ? ['0deg', '0deg'] : ['0deg', '270deg'],
  });

  const shapeStyle =
    p.shape === 'diamond'
      ? { borderRadius: 2, transform: [{ translateY }, { translateX }, { rotate: '45deg' }] }
      : p.shape === 'leaf'
      ? { borderRadius: p.size * 0.3, width: p.size * 1.6, height: p.size * 0.7, transform: [{ translateY }, { translateX }, { rotate }] }
      : { borderRadius: p.size / 2, transform: [{ translateY }, { translateX }] };

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: p.startX * W,
          width: p.size,
          height: p.size,
          backgroundColor: color,
          opacity,
        },
        shapeStyle,
      ]}
    />
  );
}

interface Props {
  color: string;
}

export default function FloatingParticles({ color }: Props) {
  return (
    <View style={styles.container} pointerEvents="none">
      {PARTICLES.map((p) => (
        <ParticleDot key={p.id} p={p} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    bottom: 0,
  },
});
