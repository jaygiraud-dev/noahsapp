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
import { supabase, authRedirectUrl } from '../../lib/supabase';
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const [email, setEmail] = useState(route?.params?.email ?? '');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recovery flow — shown when user clicks the link in their email
  const passwordRecovery = useStore((s) => s.passwordRecovery);
  const setPasswordRecovery = useStore((s) => s.setPasswordRecovery);
  const [isRecovery, setIsRecovery] = useState(passwordRecovery);
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

  // Seconds until another link can be requested (Supabase allows one per minute per email)
  const [wait, setWait] = useState(0);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function handleSendLink() {
    const trimmed = email.trim();
    if (!trimmed || wait > 0) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed.toLowerCase(), { redirectTo: authRedirectUrl() });
    setLoading(false);
    if (err) {
      const after = /after (\d+) seconds/i.exec(err.message);
      if (after) setWait(Number(after[1]));
      setError(friendlyResetError(err.message));
    } else {
      setSent(true);
      setWait(60);
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
      // Sign out of the recovery session so they sign in fresh with the new password
      setTimeout(async () => {
        await supabase.auth.signOut();
        setPasswordRecovery(false);
      }, 2500);
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
          <View style={styles.form}>
            <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.sub, marginBottom: 0 }]}>
              If there’s an account for {email.trim()}, a reset link is on its way. Tap it and you’ll come back here to set a new password.
            </Text>
            <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.sub, marginBottom: 0 }]}>
              Not there after a couple of minutes? Check Junk or Spam, and make sure this is the email you signed up with.
            </Text>
            {!!error && (
              <Text style={[styles.errorText, { fontFamily: theme.fBody }]}>{error}</Text>
            )}
            <PrimaryBtn
              label={wait > 0 ? `Send again in ${wait}s` : 'Send it again'}
              onPress={handleSendLink}
              loading={loading}
              disabled={wait > 0}
            />
            <TouchableOpacity onPress={() => { setSent(false); setError(''); }} accessibilityRole="button">
              <Text style={[styles.backText, { fontFamily: theme.fMono, color: theme.accent, textAlign: 'center' }]}>Use a different email</Text>
            </TouchableOpacity>
          </View>
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
            <PrimaryBtn
              label={wait > 0 ? `Try again in ${wait}s` : 'Send reset link'}
              onPress={handleSendLink}
              loading={loading}
              disabled={wait > 0}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function friendlyResetError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit')) return 'Too many emails have been sent from the app in the last hour. Wait a while, then try again.';
  if (/after \d+ seconds/.test(m)) return 'A link was just sent. You can ask for another in a minute.';
  if (m.includes('not authorized')) return 'The app can’t email this address yet. Its email sender still needs setting up (README, setup step 3).';
  if (m.includes('invalid') && m.includes('email')) return 'That doesn’t look like an email address.';
  if (m.includes('fetch') || m.includes('network')) return 'Couldn’t reach the server. Check your connection and try again.';
  return message;
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
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: { fontSize: 13, color: '#f87171' },
});
