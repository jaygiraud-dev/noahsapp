import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';

export default function ResetPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recovery flow — shown when user clicks the link in their email
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  useEffect(() => {
    // Supabase parses the URL hash on load and fires PASSWORD_RECOVERY when
    // the user arrives via the reset-password email link.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSendLink() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: 'https://xaziss.netlify.app',
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  async function handleSetPassword() {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setPasswordUpdated(true);
      setTimeout(() => navigation.navigate('SignIn'), 2500);
    }
  }

  // ─── Recovery view (user arrived via email link) ────────────────────────────
  if (isRecovery) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.container}>
          <SerifTitle size={32} style={styles.title}>
            {passwordUpdated ? 'Password updated.' : 'Set new password.'}
          </SerifTitle>

          {passwordUpdated ? (
            <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.sub }]}>
              All done! Taking you back to sign in…
            </Text>
          ) : (
            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <MicroLabel>New password</MicroLabel>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="min 6 characters"
                  placeholderTextColor={theme.soft}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.fieldGroup}>
                <MicroLabel>Confirm password</MicroLabel>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="repeat password"
                  placeholderTextColor={theme.soft}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {!!error && (
                <Text style={[styles.errorText, { fontFamily: theme.fBody }]}>{error}</Text>
              )}
              <PrimaryBtn label="Update password" onPress={handleSetPassword} loading={loading} />
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Request-link view ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={[styles.backText, { fontFamily: theme.fMono, color: theme.accent }]}>
            ← back
          </Text>
        </TouchableOpacity>

        <SerifTitle size={32} style={styles.title}>
          {sent ? 'Check your inbox.' : 'Reset password.'}
        </SerifTitle>

        {sent ? (
          <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.sub }]}>
            We sent a reset link to {email}. Tap the link in your email — it'll bring you back here to set a new password.
          </Text>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.sub }]}>
              Enter your email and we'll send a link to reset your password.
            </Text>
            <View style={styles.fieldGroup}>
              <MicroLabel>Email</MicroLabel>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@school.ca"
                placeholderTextColor={theme.soft}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {!!error && (
              <Text style={[styles.errorText, { fontFamily: theme.fBody }]}>{error}</Text>
            )}
            <PrimaryBtn label="Send reset link" onPress={handleSendLink} loading={loading} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  back: { marginBottom: 32 },
  backText: { fontSize: 13, letterSpacing: 0.5 },
  title: { marginBottom: 16 },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: { fontSize: 13, color: '#f87171' },
});
