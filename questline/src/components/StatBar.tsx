import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, PILLARS, Pillar } from '../theme';

// A single pillar stat: label, level, recent (+N) gain, and an animated bar.
export default function StatBar({
  pillar,
  value,
  recent,
  compact,
}: {
  pillar: Pillar;
  value: number;
  recent: number;
  compact?: boolean;
}) {
  const meta = PILLARS[pillar];
  const w = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(w, { toValue: value, useNativeDriver: false, tension: 36, friction: 9 }).start();
  }, [value]);

  const widthInterp = w.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: T.ink }]}>{meta.label}</Text>
        <View style={styles.valRow}>
          <Text style={[styles.value, { color: T.ink }]}>{Math.round(value)}</Text>
          {recent > 0 && (
            <Text style={[styles.recent, { color: meta.color }]}>(+{recent})</Text>
          )}
        </View>
      </View>
      <View style={[styles.track, compact && { height: 7 }]}>
        <Animated.View style={[styles.fillWrap, { width: widthInterp }]}>
          <LinearGradient
            colors={[meta.color + 'AA', meta.color]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  label: { fontFamily: T.fMed, fontSize: 14, letterSpacing: 0.2 },
  valRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  value: { fontFamily: T.fMonoB, fontSize: 16 },
  recent: { fontFamily: T.fMono, fontSize: 12 },
  track: {
    height: 9,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  fillWrap: { height: '100%', borderRadius: 6, overflow: 'hidden' },
  fill: { flex: 1 },
});
