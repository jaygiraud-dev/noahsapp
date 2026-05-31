import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import PrimaryBtn from '../../components/PrimaryBtn';
import MicroLabel from '../../components/MicroLabel';
import SerifTitle from '../../components/SerifTitle';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'added' | 'already' | 'not_found' | 'self' | 'error';

const STATUS_MSG: Record<Status, string> = {
  idle: '',
  loading: '',
  added: '✓ Friend added!',
  already: 'Already in your squad.',
  not_found: 'No student found with that code.',
  self: "That's your own code!",
  error: 'Something went wrong. Try again.',
};

export default function AddFriendSheet({ visible, onClose }: Props) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [copied, setCopied] = useState(false);

  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const addFriendByCode = useStore((s) => s.addFriendByCode);
  const pairingCode = useStore((s) => s.pairingCode);
  const theme = makeTheme(vibe, darkMode);

  async function handleAdd() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setStatus('loading');
    try {
      const result = await addFriendByCode(trimmed);
      setStatus(result);
      if (result === 'added') {
        setCode('');
        setTimeout(onClose, 1200);
      }
    } catch {
      setStatus('error');
    }
  }

  async function handleCopy() {
    try {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        await navigator.clipboard.writeText(pairingCode);
      }
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setCode('');
    setStatus('idle');
    setCopied(false);
    onClose();
  }

  const statusColor =
    status === 'added' ? theme.mint :
    status === 'already' || status === 'not_found' || status === 'self' || status === 'error' ? '#ef4444' :
    theme.soft;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modal, { backgroundColor: theme.bg }]}
      >
        <View style={[styles.handle, { backgroundColor: theme.line }]} />
        <View style={styles.header}>
          <SerifTitle size={24}>Add a friend.</SerifTitle>
          <TouchableOpacity onPress={handleClose}>
            <Text style={[styles.close, { color: theme.soft }]}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Enter friend's code */}
        <View style={styles.section}>
          <MicroLabel>Enter their pairing code</MicroLabel>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.codeInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: status === 'not_found' || status === 'self' || status === 'error' ? '#ef4444' :
                                status === 'added' ? theme.mint : theme.line,
                  color: theme.ink,
                  fontFamily: theme.fMono,
                },
              ]}
              value={code}
              onChangeText={(t) => { setCode(t.toUpperCase()); setStatus('idle'); }}
              placeholder="e.g. ABC123"
              placeholderTextColor={theme.soft}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity
              style={[
                styles.addBtn,
                {
                  backgroundColor: code.trim().length >= 4 ? theme.accent : theme.line,
                  opacity: status === 'loading' ? 0.6 : 1,
                },
              ]}
              onPress={handleAdd}
              disabled={status === 'loading' || code.trim().length < 4}
              activeOpacity={0.8}
            >
              {status === 'loading' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.addBtnText, { fontFamily: theme.fMono }]}>Add</Text>
              )}
            </TouchableOpacity>
          </View>

          {status !== 'idle' && status !== 'loading' && (
            <Text style={[styles.statusMsg, { fontFamily: theme.fMono, color: statusColor }]}>
              {STATUS_MSG[status]}
            </Text>
          )}
        </View>

        {/* Share your own code */}
        <View style={styles.section}>
          <MicroLabel>Your code — share with friends</MicroLabel>
          <View style={[styles.codeBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <Text style={[styles.myCode, { fontFamily: theme.fMono, color: theme.accent }]}>
              {pairingCode || '—'}
            </Text>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: copied ? theme.mint : theme.accent }]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Text style={[styles.copyText, { fontFamily: theme.fMono, color: '#fff' }]}>
                {copied ? 'copied!' : 'copy'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>
            Your friend types this in their app to add you.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  close: { fontSize: 28, lineHeight: 32 },
  section: { paddingHorizontal: 20, gap: 10, marginBottom: 28 },
  inputRow: { flexDirection: 'row', gap: 10 },
  codeInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    letterSpacing: 4,
  },
  addBtn: {
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 72,
  },
  addBtnText: { color: '#fff', fontSize: 14, letterSpacing: 0.5 },
  statusMsg: { fontSize: 13, letterSpacing: 0.3, marginTop: 2 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  myCode: { fontSize: 24, letterSpacing: 5 },
  copyBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  copyText: { fontSize: 12, letterSpacing: 0.5 },
  hint: { fontSize: 12, lineHeight: 18 },
});
