import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

interface Particle {
  id: number;
  startX: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  driftX: number;
  shape: 'diamond' | 'petal' | 'spark';
}

const PARTICLES: Particle[] = [
  // Large visible pieces — lead with these so you notice them
  { id: 0,  startX: 0.15, size: 14, duration: 6500,  delay: 0,    opacity: 0.55, driftX: -80,  shape: 'petal'   },
  { id: 1,  startX: 0.78, size: 12, duration: 7800,  delay: 800,  opacity: 0.50, driftX: -100, shape: 'petal'   },
  { id: 2,  startX: 0.42, size: 10, duration: 5800,  delay: 2200, opacity: 0.52, driftX: -60,  shape: 'diamond' },
  { id: 3,  startX: 0.60, size: 16, duration: 9000,  delay: 4000, opacity: 0.48, driftX: -90,  shape: 'petal'   },
  { id: 4,  startX: 0.25, size: 11, duration: 7200,  delay: 1500, opacity: 0.50, driftX: -70,  shape: 'diamond' },
  { id: 5,  startX: 0.88, size: 13, duration: 8500,  delay: 3000, opacity: 0.45, driftX: -110, shape: 'petal'   },
  // Medium
  { id: 6,  startX: 0.08, size: 8,  duration: 6000,  delay: 5500, opacity: 0.42, driftX: -50,  shape: 'spark'   },
  { id: 7,  startX: 0.52, size: 9,  duration: 7000,  delay: 6800, opacity: 0.44, driftX: -65,  shape: 'petal'   },
  { id: 8,  startX: 0.35, size: 10, duration: 8200,  delay: 200,  opacity: 0.46, driftX: -75,  shape: 'diamond' },
  { id: 9,  startX: 0.70, size: 8,  duration: 6800,  delay: 7200, opacity: 0.40, driftX: -55,  shape: 'spark'   },
  // Small fillers
  { id: 10, startX: 0.93, size: 6,  duration: 5500,  delay: 3800, opacity: 0.38, driftX: -40,  shape: 'diamond' },
  { id: 11, startX: 0.48, size: 7,  duration: 9500,  delay: 9000, opacity: 0.36, driftX: -85,  shape: 'petal'   },
  { id: 12, startX: 0.20, size: 6,  duration: 6200,  delay: 4600, opacity: 0.40, driftX: -45,  shape: 'spark'   },
  { id: 13, startX: 0.65, size: 8,  duration: 7600,  delay: 10500, opacity: 0.38, driftX: -60, shape: 'diamond' },
  { id: 14, startX: 0.82, size: 7,  duration: 8800,  delay: 1200, opacity: 0.42, driftX: -95,  shape: 'petal'   },
  { id: 15, startX: 0.03, size: 9,  duration: 7400,  delay: 8200, opacity: 0.44, driftX: -50,  shape: 'diamond' },
];

function Petal({ p, color }: { p: Particle; color: string }) {
  const prog = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      prog.setValue(0);
      spin.setValue(0);
      Animated.parallel([
        Animated.timing(prog, { toValue: 1, duration: p.duration, useNativeDriver: true }),
        Animated.timing(spin, { toValue: 1, duration: p.duration * 0.7, useNativeDriver: true }),
      ]).start(() => loop());
    };
    const t = setTimeout(loop, p.delay % 6000);
    return () => clearTimeout(t);
  }, []);

  // Element is anchored at the bottom edge; start just below it and rise past the top
  const translateY = prog.interpolate({
    inputRange: [0, 1],
    outputRange: [p.size * 2, -(H + 150)],
  });

  // Smooth S-curve horizontal drift
  const translateX = prog.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0, p.driftX * 0.35, p.driftX * 0.72, p.driftX],
  });

  const opacity = prog.interpolate({
    inputRange: [0, 0.08, 0.80, 1],
    outputRange: [0, p.opacity, p.opacity, 0],
  });

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', p.shape === 'spark' ? '180deg' : '320deg'],
  });

  // Petal: wide flat ellipse; Diamond: equal square rotated 45°; Spark: small circle
  const shapeW = p.shape === 'petal' ? p.size * 2.2 : p.shape === 'spark' ? p.size * 0.9 : p.size;
  const shapeH = p.shape === 'petal' ? p.size * 0.75 : p.size;
  const radius = p.shape === 'diamond' ? 3 : p.shape === 'spark' ? shapeH / 2 : p.size * 0.35;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: p.startX * W - shapeW / 2,
        width: shapeW,
        height: shapeH,
        borderRadius: radius,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
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
        <Petal key={p.id} p={p} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    overflow: 'hidden',
  },
});
