import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import PrimaryBtn from '../../components/PrimaryBtn';
import GhostBtn from '../../components/GhostBtn';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';

export default function ParentPairScreen({ navigation }: any) {
  const pairingCode = useStore((s) => s.pairingCode);
  const parentPaired = useStore((s) => s.parentPaired);
  const setPhase = useStore((s) => s.setPhase);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={[styles.backText, { fontFamily: theme.fMono, color: theme.accent }]}>
            ← back
          </Text>
        </TouchableOpacity>

        <MicroLabel color={theme.accent}>Step 3 of 3</MicroLabel>
        <SerifTitle size={28} style={styles.title}>
          {parentPaired ? 'Parent connected.' : 'Pair with a parent.'}
        </SerifTitle>

        <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.sub }]}>
          {parentPaired
            ? 'A parent app is connected to your account.'
            : 'Share this code with a parent. They\'ll enter it in the parent app to connect.'}
        </Text>

        <View style={styles.codeSection}>
          <MicroLabel style={styles.codeLabel}>Your pairing code</MicroLabel>
          <LinearGradient
            colors={theme.accentGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.codeCard}
          >
            <Text style={[styles.code, { fontFamily: theme.fMono }]}>
              {pairingCode}
            </Text>
          </LinearGradient>
          <Text style={[styles.codeHint, { fontFamily: theme.fBody, color: theme.soft }]}>
            Code expires in 48 hours
          </Text>
        </View>

        {parentPaired && (
          <View style={[styles.pairedBadge, { backgroundColor: theme.mint + '22', borderColor: theme.mint }]}>
            <Text style={[styles.pairedText, { fontFamily: theme.fBodyMedium, color: theme.mint }]}>
              ✓ Parent app linked
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <PrimaryBtn
            label={parentPaired ? 'Go to my agenda →' : "I'm done →"}
            onPress={() => setPhase('main')}
          />
          {!parentPaired && (
            <GhostBtn
              label="Skip — do this later"
              onPress={() => setPhase('main')}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, gap: 16 },
  back: {},
  backText: { fontSize: 13, letterSpacing: 0.5 },
  title: {},
  body: { fontSize: 15, lineHeight: 22 },
  codeSection: { gap: 10, alignItems: 'center', paddingVertical: 16 },
  codeLabel: {},
  codeCard: {
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#a78bfa',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  code: {
    fontSize: 36,
    letterSpacing: 8,
    color: '#fff',
  },
  codeHint: { fontSize: 12 },
  pairedBadge: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  pairedText: { fontSize: 15 },
  actions: { gap: 12, marginTop: 8 },
});
