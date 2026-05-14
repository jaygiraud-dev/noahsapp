import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useParentStore } from '../store/useParentStore';
import { makeTheme } from '../theme';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
const CODE_LENGTH = 6;

export default function PairScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const pairKid = useParentStore((s) => s.pairKid);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const theme = makeTheme('twilight', true);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function press(digit: string) {
    if (digit === '⌫') {
      setCode((c) => c.slice(0, -1));
      setError('');
      return;
    }
    if (!digit) return;
    const next = (code + digit).slice(0, CODE_LENGTH);
    setCode(next);
    setError('');
    if (next.length === CODE_LENGTH) {
      setTimeout(() => handlePair(next), 100);
    }
  }

  function handlePair(c: string) {
    const upper = c.toUpperCase();
    if (upper === '7K4M2D') {
      pairKid(upper);
    } else {
      setError('Code not found. Try again.');
      setCode('');
      shake();
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.container}>
        <LinearGradient
          colors={theme.accentGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoWrap}
        >
          <Text style={[styles.logoMark, { fontFamily: theme.fDisplayItalic }]}>p</Text>
        </LinearGradient>
        <Text style={[styles.appName, { fontFamily: theme.fMono, color: theme.sub }]}>
          my agenda
        </Text>
        <Text style={[styles.appSub, { fontFamily: theme.fMono, color: theme.soft }]}>
          for parents
        </Text>
        <Text style={[styles.headline, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
          Enter the code from{`\n`}your child’s app.
        </Text>

        {/* Code display */}
        <Animated.View
          style={[styles.codeDisplay, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: CODE_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.codeChar,
                {
                  backgroundColor: theme.surface,
                  borderColor: i < code.length ? theme.accent : theme.line,
                },
              ]}
            >
              <Text style={[styles.codeCharText, { fontFamily: theme.fMono, color: theme.ink }]}>
                {code[i] ?? ''}
              </Text>
            </View>
          ))}
        </Animated.View>

        {error ? (
          <Text style={[styles.error, { fontFamily: theme.fMono, color: theme.red }]}>{error}</Text>
        ) : null}

        {/* Keypad */}
        <View style={styles.keypad}>
          {DIGITS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.key,
                { backgroundColor: d === '' ? 'transparent' : theme.surface, borderColor: theme.line },
              ]}
              onPress={() => press(d)}
              disabled={d === ''}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.keyText,
                  { fontFamily: theme.fMono, color: d === '⌫' ? theme.red : theme.ink },
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 40, gap: 16 },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMark: { fontSize: 36, color: '#fff' },
  appName: { fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' },
  appSub: { fontSize: 10, letterSpacing: 2, marginTop: -10 },
  headline: { fontSize: 26, textAlign: 'center', lineHeight: 34, marginTop: 8 },
  codeDisplay: { flexDirection: 'row', gap: 10, marginTop: 8 },
  codeChar: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCharText: { fontSize: 22, letterSpacing: 1 },
  error: { fontSize: 12, letterSpacing: 0.5, marginTop: -4 },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    maxWidth: 280,
  },
  key: {
    width: 72,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: { fontSize: 22 },
});
