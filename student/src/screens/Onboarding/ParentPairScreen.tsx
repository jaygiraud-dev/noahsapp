import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { pickImage } from '../../lib/images';
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';
import Avatar from '../../components/Avatar';

/** Step 3: profile photo (optional) + the code a parent types to connect. */
export default function ParentPairScreen({ navigation }: any) {
  const pairingCode = useStore((s) => s.pairingCode);
  const userId = useStore((s) => s.userId);
  const displayName = useStore((s) => s.displayName);
  const avatar = useStore((s) => s.avatar);
  const setAvatar = useStore((s) => s.setAvatar);
  const parents = useStore((s) => s.parents);
  const loadParents = useStore((s) => s.loadParents);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const [copied, setCopied] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  // Watch for a parent linking: live update when available, polling as a backup
  useEffect(() => {
    if (!userId) return;
    loadParents();
    const poll = setInterval(() => loadParents(), 5000);
    const channel = supabase
      .channel(`links:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'parent_student_links', filter: `student_id=eq.${userId}` }, () => loadParents())
      .subscribe();
    return () => { clearInterval(poll); supabase.removeChannel(channel); };
  }, [userId]);

  async function choosePhoto() {
    setPhotoBusy(true);
    try {
      const img = await pickImage({ maxSize: 256, square: true, quality: 0.7 });
      if (img) setAvatar(img.uri);
    } finally {
      setPhotoBusy(false);
    }
  }

  async function copyCode() {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(pairingCode);
      else Clipboard.setString(pairingCode);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const connected = parents.length > 0;
  const isDemo = !userId;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { fontFamily: theme.fMono, color: theme.accent }]}>← back</Text>
        </TouchableOpacity>

        <MicroLabel color={theme.accent}>Step 4 of 4</MicroLabel>
        <SerifTitle size={30}>Almost done.</SerifTitle>

        {/* Photo */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.photoRow}>
            <Avatar uri={avatar} name={displayName} size={72} colors={theme.accentGrad} fontFamily={theme.fDisplayItalic} />
            <View style={styles.photoText}>
              <Text style={[styles.cardTitle, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>Profile photo</Text>
              <Text style={[styles.cardSub, { fontFamily: theme.fBody, color: theme.sub }]}>Friends see it on the leaderboard. Optional.</Text>
            </View>
          </View>
          <View style={styles.photoBtns}>
            <TouchableOpacity style={[styles.smallBtn, { backgroundColor: theme.accent }]} onPress={choosePhoto} disabled={photoBusy}>
              <Text style={[styles.smallBtnText, { fontFamily: theme.fMono }]}>{photoBusy ? 'Loading…' : avatar ? 'Change photo' : 'Add a photo'}</Text>
            </TouchableOpacity>
            {avatar !== '' && (
              <TouchableOpacity style={[styles.smallBtn, { borderWidth: 1, borderColor: theme.line }]} onPress={() => setAvatar('')}>
                <Text style={[styles.smallBtnText, { fontFamily: theme.fMono, color: theme.soft }]}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Parent code */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>Connect a parent</Text>
          <Text style={[styles.cardSub, { fontFamily: theme.fBody, color: theme.sub }]}>
            Your parent makes a parent account, then types this code. They’ll see your homework and schedule, not your friends.
          </Text>
          {isDemo ? (
            <Text style={[styles.cardSub, { fontFamily: theme.fBody, color: theme.soft }]}>Create an account to get your code.</Text>
          ) : (
            <TouchableOpacity onPress={copyCode} activeOpacity={0.8} accessibilityLabel="Copy pairing code">
              <LinearGradient colors={theme.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.codeCard}>
                <Text style={[pairingCode ? styles.code : styles.codeMissing, { fontFamily: theme.fMono }]}>{pairingCode || 'Code not ready yet'}</Text>
                <Text style={[styles.copyHint, { fontFamily: theme.fMono }]}>{copied ? '✓ copied' : 'tap to copy'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {!isDemo && !pairingCode && (
            <Text style={[styles.waiting, { fontFamily: theme.fBody, color: theme.amber }]}>Your code isn’t ready yet. It appears once the app’s database update has been run (README, setup step 1).</Text>
          )}
          {connected ? (
            <View style={[styles.status, { backgroundColor: theme.mint + '22', borderColor: theme.mint }]}>
              <Text style={[styles.statusText, { fontFamily: theme.fBodyMedium, color: theme.mint }]}>
                ✓ Connected to {parents.map((p) => p.name).join(' and ')}
              </Text>
            </View>
          ) : !isDemo ? (
            <Text style={[styles.waiting, { fontFamily: theme.fMono, color: theme.soft }]}>Waiting for a parent to connect… you can do this later from Me.</Text>
          ) : null}
        </View>

        <PrimaryBtn label="Go to my agenda →" onPress={completeOnboarding} style={styles.go} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, gap: 14 },
  backText: { fontSize: 15, letterSpacing: 0.5, marginBottom: 4 },
  card: { borderRadius: 24, padding: 18, gap: 12 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photoText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17 },
  cardSub: { fontSize: 16, lineHeight: 22 },
  photoBtns: { flexDirection: 'row', gap: 10 },
  smallBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  smallBtnText: { fontSize: 14, color: '#fff', letterSpacing: 0.3 },
  codeCard: { borderRadius: 20, paddingVertical: 22, alignItems: 'center', gap: 4 },
  code: { fontSize: 36, letterSpacing: 8, color: '#fff' },
  codeMissing: { fontSize: 17, color: '#fff' },
  copyHint: { fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: 1 },
  status: { borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
  statusText: { fontSize: 16 },
  waiting: { fontSize: 13, letterSpacing: 0.3, textAlign: 'center', lineHeight: 18 },
  go: { marginTop: 8 },
});
