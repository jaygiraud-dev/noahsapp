import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface Particle {
  id: number;
  x: string; // percentage like '23%'
  size: number;
  duration: number;
  delay: number;
  opacityMax: number;
}

const PARTICLES: Particle[] = [
  { id: 0,  x: '8%',  size: 3, duration: 14000, delay: 0,     opacityMax: 0.18 },
  { id: 1,  x: '18%', size: 2, duration: 11000, delay: 2000,  opacityMax: 0.12 },
  { id: 2,  x: '30%', size: 4, duration: 16000, delay: 4000,  opacityMax: 0.10 },
  { id: 3,  x: '45%', size: 2, duration: 9000,  delay: 1000,  opacityMax: 0.16 },
  { id: 4,  x: '58%', size: 3, duration: 13000, delay: 5500,  opacityMax: 0.14 },
  { id: 5,  x: '70%', size: 2, duration: 10000, delay: 3000,  opacityMax: 0.12 },
  { id: 6,  x: '82%', size: 4, duration: 17000, delay: 6500,  opacityMax: 0.09 },
  { id: 7,  x: '92%', size: 2, duration: 12000, delay: 800,   opacityMax: 0.15 },
  { id: 8,  x: '13%', size: 3, duration: 15000, delay: 7000,  opacityMax: 0.11 },
  { id: 9,  x: '38%', size: 2, duration: 8500,  delay: 4500,  opacityMax: 0.13 },
  { id: 10, x: '63%', size: 3, duration: 11500, delay: 2500,  opacityMax: 0.10 },
  { id: 11, x: '88%', size: 2, duration: 14500, delay: 6000,  opacityMax: 0.16 },
];

function ParticleDot({ particle, color }: { particle: Particle; color: string }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const start = () => {
      y.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(particle.delay % 3000),
        Animated.parallel([
          Animated.timing(y, {
            toValue: -1,
            duration: particle.duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: particle.opacityMax, duration: particle.duration * 0.2, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: particle.opacityMax, duration: particle.duration * 0.6, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: particle.duration * 0.2, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => start());
    };
    const t = setTimeout(start, particle.delay);
    return () => clearTimeout(t);
  }, []);

  const screenHeight = 900;
  const translateY = y.interpolate({
    inputRange: [-1, 0],
    outputRange: [-screenHeight * 0.85, screenHeight * 0.1],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          left: particle.x as any,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: color,
          transform: [{ translateY }],
          opacity,
        },
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
        <ParticleDot key={p.id} particle={p} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    bottom: 0,
  },
});
