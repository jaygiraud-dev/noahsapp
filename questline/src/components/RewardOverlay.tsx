import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { T, PILLARS } from '../theme';
import { multiplierLabel } from '../economy';

const { width, height } = Dimensions.get('window');
const SPARK_COUNT = 22;

function SparkParticle({ i }: { i: number }) {
  const a = useRef(new Animated.Value(0)).current;
  const angle = (i / SPARK_COUNT) * Math.PI * 2 + Math.random() * 0.4;
  const dist = 120 + Math.random() * 130;
  const dx = Math.cos(angle) * dist;
  const dy = Math.sin(angle) * dist;
  const size = 7 + Math.random() * 9;

  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 1100 + Math.random() * 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        fontSize: size,
        color: i % 3 === 0 ? '#FFB13D' : i % 3 === 1 ? '#FF4D2E' : '#FF2E8B',
        opacity: a.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
        transform: [
          { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
          { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
          { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '220deg'] }) },
        ],
      }}
    >
      ✦
    </Animated.Text>
  );
}

export default function RewardOverlay() {
  const reward = useStore((s) => s.reward);
  const clearReward = useStore((s) => s.clearReward);
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const count = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!reward) return;
    setShown(0);
    scale.setValue(0.6);
    opacity.setValue(0);
    count.setValue(0);

    const id = count.addListener(({ value }) => setShown(Math.round(value * reward.sparks)));

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(count, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 320, useNativeDriver: true }).start(() => {
        clearReward();
      });
    }, 1900);

    return () => {
      clearTimeout(t);
      count.removeListener(id);
    };
  }, [reward]);

  if (!reward) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.center, { opacity }]}>
        <View style={styles.sparkField}>
          {Array.from({ length: SPARK_COUNT }).map((_, i) => (
            <SparkParticle key={i} i={i} />
          ))}
        </View>
        <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
          <LinearGradient
            colors={T.accentGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.grad}
          >
            <Text style={styles.spk}>+{shown.toLocaleString()}</Text>
            <Text style={styles.spkLabel}>✦ SPARKS</Text>
            {reward.multiplier > 1 && (
              <View style={styles.multi}>
                <Text style={styles.multiTxt}>{multiplierLabel(reward.multiplier)} streak bonus</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
        <View style={styles.statRow}>
          {reward.pillars.map((p) => (
            <View key={p.pillar} style={[styles.statChip, { borderColor: PILLARS[p.pillar].color + '66' }]}>
              <Text style={[styles.statChipTxt, { color: PILLARS[p.pillar].color }]}>
                {PILLARS[p.pillar].label} +{p.amount}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  center: { justifyContent: 'center', alignItems: 'center' },
  sparkField: { position: 'absolute', width, height, justifyContent: 'center', alignItems: 'center' },
  badge: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: T.accent,
    shadowOpacity: 0.85,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
  },
  grad: { paddingHorizontal: 44, paddingVertical: 26, alignItems: 'center' },
  spk: { fontFamily: T.fMonoB, fontSize: 52, color: '#fff', letterSpacing: -1 },
  spkLabel: { fontFamily: T.fMono, fontSize: 12, color: 'rgba(255,255,255,0.92)', letterSpacing: 3, marginTop: 2 },
  multi: {
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  multiTxt: { fontFamily: T.fSemi, fontSize: 11, color: '#fff', letterSpacing: 0.4 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 18, paddingHorizontal: 24 },
  statChip: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  statChipTxt: { fontFamily: T.fMed, fontSize: 12 },
});
