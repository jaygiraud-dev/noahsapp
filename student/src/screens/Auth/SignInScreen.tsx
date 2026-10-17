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
import { supabase, authRedirectUrl } from '../../lib/supabase';
import { enterApp } from '../../lib/session';
import PrimaryBtn from '../../components/PrimaryBtn';
import MicroLabel from '../../components/MicroLabel';

type AccountType = 'student' | 'parent';
type Mode = 'signin' | 'signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Turns Supabase's error text into something a person can act on. */
function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return "That email and password don't match an account. Check both, or create an account.";
  if (m.includes('already registered') || m.includes('already been registered')) return 'There is already an account with this email. Sign in instead.';
  if (m.includes('password should be at least')) return 'Use a password with at least 6 characters.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many tries in a row. Wait a minute, then try again.';
  if (m.includes('failed to fetch') || m.includes('network')) return "Can't reach the server. Check your internet connection and try again.";
  if (m.includes('signups not allowed')) return 'New accounts are turned off right now.';
  return msg;
}

export default function SignInScreen({ navigation, route }: any) {
  const [accountType, setAccountType] = useState<AccountType>(route?.params?.accountType ?? 'student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(route?.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>(route?.params?.mode ?? 'signin');

  const setPhase = useStore((s) => s.setPhase);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  useEffect(() => {
    if (route?.params?.email) setEmail(route.params.email);
    if (route?.params?.mode) setMode(route.params.mode);
    if (route?.params?.accountType) setAccountType(route.params.accountType);
  }, [route?.params]);

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
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    setError('');
    if (mode === 'signup' && !cleanName) { setError('Add your first name so your family and friends know it is you.'); return; }
    if (!EMAIL_RE.test(cleanEmail)) {
      setError(/\s/.test(email.trim()) ? 'Email addresses can’t contain spaces.' : 'Enter a full email address, like name@icloud.com.');
      return;
    }
    if (password.length < 6) { setError('Use a password with at least 6 characters.'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: e } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { role: accountType, display_name: cleanName },
            emailRedirectTo: authRedirectUrl(),
          },
        });
        if (e) { setError(friendlyAuthError(e.message)); return; }
        // With email confirmation on, an existing address comes back with no identities
        if (data.user && (data.user.identities ?? []).length === 0) {
          setError('There is already an account with this email. Sign in instead.');
          return;
        }
        if (data.session && data.user) {
          await enterApp(data.user);
        } else {
          navigation.navigate('ConfirmEmail', { email: cleanEmail });
        }
      } else {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (e) {
          if (e.message.toLowerCase().includes('email not confirmed')) {
            navigation.navigate('ConfirmEmail', { email: cleanEmail, notConfirmed: true });
            return;
          }
          setError(friendlyAuthError(e.message));
          return;
        }
        if (data.user) await enterApp(data.user);
      }
    } catch (e: any) {
      setError(friendlyAuthError(e?.message ?? 'Something went wrong. Try again.'));
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
  }

  const isStudent = accountType === 'student';
  const inputStyle = [styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <LinearGradient
        colors={[theme.accent + '22', theme.bg, theme.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', theme.accentGrad[1] + '10']}
        start={{ x: 0.5, y: 0.6 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.hero, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
            <Text style={[styles.eyebrow, { fontFamily: theme.fMono, color: theme.accent }]}>✦ MY AGENDA</Text>
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
              {mode === 'signin' ? 'welcome\nback.' : isStudent ? 'join the\nsquad.' : 'stay in\nthe loop.'}
            </Text>
            <Text style={[styles.tagline, { fontFamily: theme.fMono, color: theme.sub }]}>
              {mode === 'signup' && !isStudent ? "SEE YOUR KID'S HOMEWORK · WITHOUT ASKING" : 'YOUR SCHOOL · YOUR SQUAD · YOUR STREAK'}
            </Text>
            <View style={styles.ruleRow}>
              <View style={[styles.ruleLine, { backgroundColor: theme.accent + '40' }]} />
              <View style={[styles.ruleDiamond, { backgroundColor: theme.accent }]} />
              <View style={[styles.ruleLine, { backgroundColor: theme.accent + '40' }]} />
            </View>
          </Animated.View>

          <Animated.View style={[styles.formWrap, { opacity: formOpacity, transform: [{ translateY: formY }] }]}>
            {mode === 'signup' && (
              <>
                <Text style={[styles.question, { fontFamily: theme.fBodyMedium, color: theme.sub }]}>Who is this account for?</Text>
                <View style={[styles.typeToggle, { backgroundColor: theme.surface }]}>
                  {(['student', 'parent'] as AccountType[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeOption, accountType === t && { backgroundColor: theme.accent }]}
                      onPress={() => setAccountType(t)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: accountType === t }}
                    >
                      <Text style={[styles.typeLabel, { fontFamily: theme.fMono, color: accountType === t ? '#fff' : theme.soft }]}>
                        {t === 'student' ? '🎒  Student' : '👨‍👩‍👧  Parent'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.form}>
              {mode === 'signup' && (
                <View style={styles.fieldGroup}>
                  <MicroLabel>First name</MicroLabel>
                  <TextInput
                    style={inputStyle}
                    value={name}
                    onChangeText={(v) => { setName(v); setError(''); }}
                    placeholder={isStudent ? 'Noah' : 'Jay'}
                    placeholderTextColor={theme.soft}
                    autoCapitalize="words"
                    autoComplete="given-name"
                    maxLength={40}
                  />
                </View>
              )}

              <View style={styles.fieldGroup}>
                <MicroLabel>Email</MicroLabel>
                <TextInput
                  style={inputStyle}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); }}
                  placeholder="you@icloud.com"
                  placeholderTextColor={theme.soft}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <View style={styles.fieldGroup}>
                <MicroLabel>Password</MicroLabel>
                <TextInput
                  style={inputStyle}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(''); }}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  placeholderTextColor={theme.soft}
                  secureTextEntry
                  autoComplete={mode === 'signup' ? 'new-password' : 'password'}
                  onSubmitEditing={handleAuth}
                />
              </View>

              {error !== '' && (
                <Text style={[styles.errorText, { fontFamily: theme.fBody, color: theme.red }]} accessibilityLiveRegion="polite">
                  {error}
                </Text>
              )}

              {mode === 'signin' && (
                <TouchableOpacity onPress={() => navigation.navigate('ResetPassword', { email: email.trim() })} style={styles.forgotWrap}>
                  <Text style={[styles.forgot, { fontFamily: theme.fBody, color: theme.accent }]}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              <PrimaryBtn
                label={mode === 'signin' ? 'Sign in' : isStudent ? 'Create student account' : 'Create parent account'}
                onPress={handleAuth}
                loading={loading}
                style={styles.btn}
              />

              <TouchableOpacity onPress={switchMode} style={styles.switchWrap}>
                <Text style={[styles.switch, { fontFamily: theme.fBody, color: theme.soft }]}>
                  {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
                  <Text style={{ color: theme.accent }}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.demoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>JUST LOOKING?</Text>
              <View style={styles.demoRow}>
                <TouchableOpacity onPress={() => setPhase('main')} style={[styles.demoBtn, { borderColor: theme.line }]}>
                  <Text style={[styles.demo, { fontFamily: theme.fMono, color: theme.sub }]}>Student demo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPhase('parent')} style={[styles.demoBtn, { borderColor: theme.line }]}>
                  <Text style={[styles.demo, { fontFamily: theme.fMono, color: theme.sub }]}>Parent demo</Text>
                </TouchableOpacity>
              </View>
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

  hero: { paddingTop: 44, paddingBottom: 28, alignItems: 'flex-start' },
  eyebrow: { fontSize: 12, letterSpacing: 3, marginBottom: 16 },
  heroTitle: { fontSize: 64, lineHeight: 68, marginBottom: 14 },
  tagline: { fontSize: 11, letterSpacing: 2, marginBottom: 20 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '60%' },
  ruleLine: { flex: 1, height: 1 },
  ruleDiamond: { width: 5, height: 5, transform: [{ rotate: '45deg' }] },

  formWrap: { flex: 1 },
  question: { fontSize: 16, marginBottom: 8 },
  typeToggle: { flexDirection: 'row', borderRadius: 34, padding: 4, marginBottom: 20 },
  typeOption: { flex: 1, borderRadius: 28, paddingVertical: 10, alignItems: 'center' },
  typeLabel: { fontSize: 15, letterSpacing: 0.5 },
  form: {},
  fieldGroup: { marginBottom: 14, gap: 6 },
  input: { borderRadius: 32, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 17 },
  errorText: { fontSize: 16, lineHeight: 22, marginBottom: 10, textAlign: 'center' },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 4 },
  forgot: { fontSize: 16 },
  btn: { marginTop: 6, marginBottom: 16 },
  switchWrap: { alignItems: 'center' },
  switch: { fontSize: 16 },
  footer: { alignItems: 'center', paddingTop: 32, gap: 10 },
  demoLabel: { fontSize: 11, letterSpacing: 2 },
  demoRow: { flexDirection: 'row', gap: 10 },
  demoBtn: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  demo: { fontSize: 13, letterSpacing: 0.5 },
});
