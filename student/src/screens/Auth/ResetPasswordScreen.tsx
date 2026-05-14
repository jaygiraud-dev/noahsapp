import React, { useState } from 'react';
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
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';

export default function ResetPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  async function handleReset() {
    setLoading(true);
    // TODO: supabase.auth.resetPasswordForEmail(email)
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  }

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
            We sent a reset link to {email}. Check your email and follow the link.
          </Text>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.sub }]}>
              Enter your school email and we'll send a link to reset your password.
            </Text>
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
              />
            </View>
            <PrimaryBtn label="Send reset link" onPress={handleReset} loading={loading} />
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
});
