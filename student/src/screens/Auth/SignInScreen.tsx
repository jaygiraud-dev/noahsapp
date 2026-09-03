import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { upsertProfile, fetchProfileState } from '../../lib/db';
import PrimaryBtn from '../../components/PrimaryBtn';
import MicroLabel from '../../components/MicroLabel';
import FloatingParticles from '../../components/FloatingParticles';

type AccountType = 'student' | 'parent';
type Mode = 'signin' | 'signup';

export default function SignInScreen({ navigation }: any) {
  const [accountType, setAccountType] = useState<AccountType>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('signin');

  const setPhase = useStore((s) => s.setPhase);
  const setUserRole = useStore((s) => s.setUserRole);
  const storedUserId = useStore((s) => s.userId);
  const school = useStore((s) => s.school);
  const resetForUser = useStore((s) => s.resetForUser);
  const loadDataFromSupabase = useStore((s) => s.loadDataFromSupabase);
  const applyProfileState = useStore((s) => s.applyProfileState);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  // Entrance animation
  const titleY = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(titleY, { toValue: 0, duration: 900, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formY, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(formOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  async function handleAuth() {
    setError('');
    setLoading(true);

    let authError: string | null = null;
    const role: 'student' | 'parent' = accountType;
    let uid = '';
    let emailAddr = email;

    if (mode === 'signup') {
      const { data, error: e } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role } },
      });
      if (e) authError = e.message;
      else uid = data.user?.id ?? '';
    } else {
      const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) authError = e.message;
      else { uid = data.user?.id ?? ''; emailAddr = data.user?.email ?? email; }
    }

    setLoading(false);

    if (authError) {
      setError(authError);
      return;
    }

    if (!uid) return;

    const displayName = emailAddr.split('@')[0];

    if (uid !== storedUserId) {
      // New device (or a different user was here last). Start clean, then pull
      // back whatever this account already saved: pairing code, classes, points…
      resetForUser(uid, role, displayName);
      if (role === 'student') {
        const existing = await fetchProfileState(uid).catch(() => null);
        if (existing) applyProfileState(existing);
      }
    } else {
      setUserRole(role);
      setPhase(role === 'parent' ? 'parent' : 'main');
    }

    const st = useStore.getState();
    await upsertProfile(
      uid, role,
      role === 'student' ? st.pairingCode : undefined,
      role === 'student' ? st.school.name : undefined,
      displayName
    ).catch(() => {});
    if (role === 'student') loadDataFromSupabase().catch(() => {});
  }

  const isStudent = accountType === 'student';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* Atmospheric backdrop */}
      <LinearGradient
        colors={[theme.accent + '22', theme.bg, theme.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {/* Bottom warm pool */}
      <LinearGradient
        colors={['transparent', theme.accentGrad[1] + '10']}
        start={{ x: 0.5, y: 0.6 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <FloatingParticles color={theme.accent} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO ── */}
          <Animated.View style={[styles.hero, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
            <Text style={[styles.eyebrow, { fontFamily: theme.fMono, color: theme.accent }]}>
              ✦ MY AGENDA
            </Text>
            <Text
              style={[
                styles.heroTitle,
                {
                  fontFamily: theme.fDisplayItalic,
                  color: theme.ink,
                  textShadowColor: theme.accent + '55',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 28,
                },
              ]}
            >
              {mode === 'signin'
                ? isStudent ? 'welcome\nback.' : 'hi,\nparent.'
                : isStudent ? 'join the\nsquad.' : 'stay in\nthe loop.'}
            </Text>
            <Text style={[styles.tagline, { fontFamily: theme.fMono, color: theme.sub }]}>
              YOUR SCHOOL · YOUR SQUAD · YOUR STREAK
            </Text>
            {/* Decorative rule */}
            <View style={styles.ruleRow}>
              <View style={[styles.ruleLine, { backgroundColor: theme.accent + '40' }]} />
              <View style={[styles.ruleDiamond, { backgroundColor: theme.accent }]} />
              <View style={[styles.ruleLine, { backgroundColor: theme.accent + '40' }]} />
            </View>
          </Animated.View>

          {/* ── FORM ── */}
          <Animated.View style={[styles.formWrap, { opacity: formOpacity, transform: [{ translateY: formY }] }]}>
            {/* Student / Parent toggle */}
            <View style={[styles.typeToggle, { backgroundColor: theme.surface }]}>
              {(['student', 'parent'] as AccountType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeOption, accountType === t && { backgroundColor: theme.accent }]}
                  onPress={() => setAccountType(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeLabel, { fontFamily: theme.fMono, color: accountType === t ? '#fff' : theme.soft }]}>
                    {t === 'student' ? '🎒  Student' : '👨‍👩‍👧  Parent'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <MicroLabel>Email</MicroLabel>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); }}
                  placeholder={isStudent ? 'you@school.ca' : 'you@email.com'}
                  placeholderTextColor={theme.soft}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <View style={styles.fieldGroup}>
                <MicroLabel>Password</MicroLabel>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(''); }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.soft}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>

              {error !== '' && (
                <Text style={[styles.errorText, { fontFamily: theme.fBody, color: theme.red }]}>{error}</Text>
              )}

              {mode === 'signin' && (
                <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')} style={styles.forgotWrap}>
                  <Text style={[styles.forgot, { fontFamily: theme.fBody, color: theme.accent }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              )}

              <PrimaryBtn
                label={mode === 'signin' ? 'Sign in' : isStudent ? 'Create student account' : 'Create parent account'}
                onPress={handleAuth}
                loading={loading}
                style={styles.btn}
              />

              <TouchableOpacity onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }} style={styles.switchWrap}>
                <Text style={[styles.switch, { fontFamily: theme.fBody, color: theme.soft }]}>
                  {mode === 'signin' ? "Don't have an account? " : 'Already have one? '}
                  <Text style={{ color: theme.accent }}>
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => setPhase(accountType === 'parent' ? 'parent' : 'onboarding')}>
                <Text style={[styles.demo, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {accountType === 'parent' ? 'try parent demo' : 'try demo — set up your classes'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  // Hero
  hero: { paddingTop: 52, paddingBottom: 32, alignItems: 'flex-start' },
  eyebrow: { fontSize: 10, letterSpacing: 3, marginBottom: 16 },
  heroTitle: {
    fontSize: 64,
    lineHeight: 68,
    marginBottom: 14,
  },
  tagline: { fontSize: 9, letterSpacing: 2, marginBottom: 20 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '60%' },
  ruleLine: { flex: 1, height: 1 },
  ruleDiamond: { width: 5, height: 5, transform: [{ rotate: '45deg' }] },

  // Form
  formWrap: { flex: 1 },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: 34,
    padding: 4,
    marginBottom: 20,
  },
  typeOption: { flex: 1, borderRadius: 28, paddingVertical: 10, alignItems: 'center' },
  typeLabel: { fontSize: 13, letterSpacing: 0.5 },
  form: {},
  fieldGroup: { marginBottom: 14 },
  input: { borderRadius: 32, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  errorText: { fontSize: 14, marginBottom: 10, textAlign: 'center' },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 4 },
  forgot: { fontSize: 14 },
  btn: { marginTop: 6, marginBottom: 16 },
  switchWrap: { alignItems: 'center' },
  switch: { fontSize: 14 },
  footer: { alignItems: 'center', paddingTop: 28 },
  demo: { fontSize: 11, letterSpacing: 1 },
});
