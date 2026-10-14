import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Clipboard,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import MicroLabel from '../../components/MicroLabel';
import SerifTitle from '../../components/SerifTitle';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'added' | 'already' | 'not_found' | 'self' | 'not_signed_in' | 'needs_update' | 'error';

const STATUS_MSG: Record<Status, string> = {
  idle: '',
  loading: '',
  added: '✓ Added! You’re now in each other’s squad.',
  already: 'You’re already friends.',
  not_found: 'No student has that code. Check the letters and try again.',
  self: 'That’s your own code.',
  not_signed_in: 'Create an account to add friends.',
  needs_update: 'Adding friends isn’t switched on yet. The app’s database update needs to be run first (README, setup step 1).',
  error: 'Couldn’t reach the server. Check your connection and try again.',
};

export default function AddFriendSheet({ visible, onClose }: Props) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [copied, setCopied] = useState(false);
  const addFriendByCode = useStore((s) => s.addFriendByCode);
  const pairingCode = useStore((s) => s.pairingCode);
  const userId = useStore((s) => s.userId);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  async function handleAdd() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) return;
    setStatus('loading');
    const result = await addFriendByCode(trimmed);
    setStatus(result);
    if (result === 'added') { setCode(''); setTimeout(handleClose, 1400); }
  }

  async function handleCopy() {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(pairingCode);
      else Clipboard.setString(pairingCode);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() { setCode(''); setStatus('idle'); setCopied(false); onClose(); }

  const bad = status === 'not_found' || status === 'self' || status === 'error' || status === 'not_signed_in' || status === 'needs_update';
  const statusColor = status === 'added' ? theme.mint : bad ? theme.red : theme.soft;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.line }]} />
          <View style={styles.header}>
            <SerifTitle size={26}>Add a friend.</SerifTitle>
            <TouchableOpacity onPress={handleClose} accessibilityLabel="Close"><Text style={[styles.close, { color: theme.soft }]}>×</Text></TouchableOpacity>
          </View>

          <View style={styles.section}>
            <MicroLabel>Their code</MicroLabel>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.codeInput, { backgroundColor: theme.surface, borderColor: bad ? theme.red : status === 'added' ? theme.mint : theme.line, color: theme.ink, fontFamily: theme.fMono }]}
                value={code}
                onChangeText={(t) => { setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '')); setStatus('idle'); }}
                placeholder="ABC234"
                placeholderTextColor={theme.soft}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleAdd}
                accessibilityLabel="Friend's code"
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: code.length === 6 ? theme.accent : theme.line }]}
                onPress={handleAdd}
                disabled={status === 'loading' || code.length < 6}
              >
                {status === 'loading' ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.addBtnText, { fontFamily: theme.fMono }]}>Add</Text>}
              </TouchableOpacity>
            </View>
            {status !== 'idle' && status !== 'loading' && (
              <Text style={[styles.statusMsg, { fontFamily: theme.fBody, color: statusColor }]}>{STATUS_MSG[status]}</Text>
            )}
          </View>

          {userId !== '' && (
            <View style={styles.section}>
              <MicroLabel>Your code</MicroLabel>
              <View style={[styles.codeBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                {pairingCode
                  ? <Text style={[styles.myCode, { fontFamily: theme.fMono, color: theme.accent }]}>{pairingCode}</Text>
                  : <Text style={[styles.hint, { flex: 1, fontFamily: theme.fBody, color: theme.amber }]}>Your code isn’t ready yet. It appears once the app’s database update has been run (README, setup step 1).</Text>}
                <TouchableOpacity style={[styles.copyBtn, { backgroundColor: copied ? theme.mint : theme.accent }]} onPress={handleCopy}>
                  <Text style={[styles.copyText, { fontFamily: theme.fMono }]}>{copied ? 'copied!' : 'copy'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>
                Friends type this to add you. It’s the same code a parent uses to connect, so only share it with people you trust.
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  close: { fontSize: 28, lineHeight: 32 },
  section: { paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  inputRow: { flexDirection: 'row', gap: 10 },
  codeInput: { flex: 1, minWidth: 0, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, fontSize: 20, letterSpacing: 4 },
  addBtn: { borderRadius: 14, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', minWidth: 72 },
  addBtnText: { color: '#fff', fontSize: 14, letterSpacing: 0.5 },
  statusMsg: { fontSize: 14, lineHeight: 20 },
  codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  myCode: { fontSize: 24, letterSpacing: 5 },
  copyBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  copyText: { fontSize: 12, letterSpacing: 0.5, color: '#fff' },
  hint: { fontSize: 12, lineHeight: 18 },
});
