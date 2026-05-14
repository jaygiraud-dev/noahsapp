import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';

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
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  async function handleAuth() {
    setError('');
    setLoading(true);

    let authError: string | null = null;
    let role: string = accountType;

    if (mode === 'signup') {
      const { data, error: e } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: accountType } },
      });
      if (e) authError = e.message;
      else role = data.user?.user_metadata?.role ?? accountType;
    } else {
      const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) authError = e.message;
      else role = data.user?.user_metadata?.role ?? accountType;
    }

    setLoading(false);

    if (authError) {
      setError(authError);
      return;
    }

    setPhase(role === 'parent' ? 'parent' : 'onboarding');
  }

  const isStudent = accountType === 'student';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <LinearGradient
              colors={theme.accentGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoWrap}
            >
              <Text style={[styles.logoMark, { fontFamily: theme.fDisplayItalic }]}>m</Text>
            </LinearGradient>
            <Text style={[styles.appName, { fontFamily: theme.fMono, color: theme.sub }]}>
              my agenda
            </Text>
          </View>

          {/* Student / Parent toggle */}
          <View style={[styles.typeToggle, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            {(['student', 'parent'] as AccountType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeOption,
                  accountType === t && { backgroundColor: theme.accent },
                ]}
                onPress={() => setAccountType(t)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.typeLabel,
                  { fontFamily: theme.fMono, color: accountType === t ? '#fff' : theme.soft },
                ]}>
                  {t === 'student' ? '🎒  Student' : '👨‍👩‍👧  Parent'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <SerifTitle size={32} style={styles.headline}>
            {mode === 'signin'
              ? isStudent ? 'Welcome back.' : 'Hi, parent.'
              : isStudent ? 'Join the squad.' : 'Create parent account.'}
          </SerifTitle>

          {mode === 'signup' && (
            <Text style={[styles.subhead, { fontFamily: theme.fBody, color: theme.sub }]}>
              {isStudent
                ? 'Set up your classes and track homework with your squad.'
                : 'Stay connected to your child\'s agenda without the chaos.'}
            </Text>
          )}

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
              <Text style={[styles.errorText, { fontFamily: theme.fBody, color: theme.red }]}>
                {error}
              </Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  logoWrap: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  logoMark: { fontSize: 34, color: '#fff' },
  appName: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeLabel: { fontSize: 13, letterSpacing: 0.5 },
  headline: { marginBottom: 6 },
  subhead: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  form: { marginTop: 20 },
  fieldGroup: { marginBottom: 14 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  errorText: { fontSize: 14, marginBottom: 10, textAlign: 'center' },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 4 },
  forgot: { fontSize: 14 },
  btn: { marginTop: 6, marginBottom: 16 },
  switchWrap: { alignItems: 'center' },
  switch: { fontSize: 14 },
  footer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 32 },
  demo: { fontSize: 11, letterSpacing: 1 },
});
