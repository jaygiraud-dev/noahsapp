import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase, authRedirectUrl } from '../../lib/supabase';
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';

/**
 * Shown after sign-up when the account needs its email confirmed, or when
 * someone tries to sign in before confirming.
 */
export default function ConfirmEmailScreen({ navigation, route }: any) {
  const email: string = route?.params?.email ?? '';
  const notConfirmed: boolean = !!route?.params?.notConfirmed;
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  async function resend() {
    setStatus('sending');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: authRedirectUrl() },
    });
    if (error) {
      setErrorMsg(error.message.toLowerCase().includes('rate')
        ? 'An email was just sent. Wait a minute before asking for another.'
        : error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.back}>
          <Text style={[styles.backText, { fontFamily: theme.fMono, color: theme.accent }]}>← back</Text>
        </TouchableOpacity>

        <Text style={styles.icon}>✉️</Text>
        <SerifTitle size={34}>{notConfirmed ? 'Confirm your email first.' : 'Check your inbox.'}</SerifTitle>
        <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.sub }]}>
          We sent a confirmation link to{' '}
          <Text style={{ color: theme.ink, fontFamily: theme.fBodyMedium }}>{email || 'your email'}</Text>.
          Tap the link, then come back here and sign in.
        </Text>
        <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>
          Not there after a minute? Check your junk or spam folder.
        </Text>

        <PrimaryBtn
          label="I've confirmed — sign in"
          onPress={() => navigation.navigate('SignIn', { email, mode: 'signin' })}
          style={styles.primary}
        />

        <TouchableOpacity onPress={resend} disabled={status === 'sending'} style={styles.resend}>
          <Text style={[styles.resendText, { fontFamily: theme.fMono, color: status === 'sent' ? theme.mint : theme.accent }]}>
            {status === 'sending' ? 'Sending…' : status === 'sent' ? '✓ Sent a new link' : 'Send the email again'}
          </Text>
        </TouchableOpacity>
        {status === 'error' && (
          <Text style={[styles.error, { fontFamily: theme.fBody, color: theme.red }]}>{errorMsg}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, gap: 14 },
  back: { marginBottom: 24 },
  backText: { fontSize: 15, letterSpacing: 0.5 },
  icon: { fontSize: 44 },
  body: { fontSize: 17, lineHeight: 25, maxWidth: 420 },
  hint: { fontSize: 15, lineHeight: 21 },
  primary: { marginTop: 12 },
  resend: { alignSelf: 'center', padding: 8 },
  resendText: { fontSize: 14, letterSpacing: 0.5 },
  error: { fontSize: 15, textAlign: 'center' },
});
