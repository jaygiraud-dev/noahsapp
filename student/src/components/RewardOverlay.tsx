import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';

const { width, height } = Dimensions.get('window');
const CONFETTI_COUNT = 24;
const COLORS = ['#ec4899', '#a78bfa', '#06d6e0', '#fbbf24', '#34d399', '#f87171'];

function ConfettiPiece({ index }: { index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const x = (Math.random() - 0.5) * width * 1.2;
  const rotate = Math.random() * 720 - 360;
  const color = COLORS[index % COLORS.length];
  const size = 6 + Math.random() * 6;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1400 + Math.random() * 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: size,
          height: size * 0.5,
          backgroundColor: color,
          borderRadius: 2,
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, x],
              }),
            },
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, height * 0.6],
              }),
            },
            {
              rotate: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${rotate}deg`],
              }),
            },
          ],
          opacity: anim.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [1, 1, 0],
          }),
        },
      ]}
    />
  );
}

export default function RewardOverlay() {
  const reward = useStore((s) => s.reward);
  const clearReward = useStore((s) => s.clearReward);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!reward) return;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
        clearReward()
      );
    }, 1700);
    return () => clearTimeout(t);
  }, [reward]);

  if (!reward) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
      <Animated.View style={[styles.badge, { opacity, transform: [{ scale }] }]}>
        <LinearGradient
          colors={theme.accentGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={[styles.pts, { fontFamily: theme.fDisplayItalic, color: '#fff' }]}>
            +{reward.points}
          </Text>
          <Text style={[styles.ptsLabel, { fontFamily: theme.fMono, color: '#fff' }]}>
            pts
          </Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  confettiPiece: {
    position: 'absolute',
    top: height * 0.3,
    left: width / 2,
  },
  badge: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#a78bfa',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  gradient: {
    paddingHorizontal: 40,
    paddingVertical: 24,
    alignItems: 'center',
  },
  pts: {
    fontSize: 64,
    lineHeight: 68,
  },
  ptsLabel: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: -4,
  },
});
