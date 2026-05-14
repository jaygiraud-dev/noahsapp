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
import PrimaryBtn from '../../components/PrimaryBtn';
import GhostBtn from '../../components/GhostBtn';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';

export default function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const setPhase = useStore((s) => s.setPhase);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  async function handleAuth() {
    setLoading(true);
    // TODO: wire up Supabase auth — supabase.auth.signIn / signUp
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setPhase('onboarding');
  }

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
            <SerifTitle size={36} style={styles.headline}>
              {mode === 'signin' ? 'Welcome back.' : 'Join the squad.'}
            </SerifTitle>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <MicroLabel>Email</MicroLabel>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.line,
                    color: theme.ink,
                    fontFamily: theme.fBody,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@school.ca"
                placeholderTextColor={theme.soft}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.fieldGroup}>
              <MicroLabel>Password</MicroLabel>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.line,
                    color: theme.ink,
                    fontFamily: theme.fBody,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.soft}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            {mode === 'signin' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ResetPassword')}
                style={styles.forgotWrap}
              >
                <Text style={[styles.forgot, { fontFamily: theme.fBody, color: theme.accent }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            )}

            <PrimaryBtn
              label={mode === 'signin' ? 'Sign in' : 'Create account'}
              onPress={handleAuth}
              loading={loading}
              style={styles.btn}
            />

            <GhostBtn
              label={mode === 'signin' ? 'New? Create account' : 'Already have one? Sign in'}
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setPhase('onboarding')}>
              <Text style={[styles.demo, { fontFamily: theme.fMono, color: theme.soft }]}>
                try demo — set up your classes
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
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 32, gap: 8 },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoMark: { fontSize: 36, color: '#fff' },
  appName: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  headline: { textAlign: 'center', marginTop: 8 },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  forgot: { fontSize: 14 },
  btn: { marginTop: 8 },
  footer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 32 },
  demo: { fontSize: 11, letterSpacing: 1 },
});
