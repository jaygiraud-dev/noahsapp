import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { sendNudge, sendExpoPush } from '../../lib/db';
import SerifTitle from '../../components/SerifTitle';
import PrimaryBtn from '../../components/PrimaryBtn';

const PRESETS = [
  'How’s the homework going? 👋',
  'Don’t forget what’s due tomorrow 📚',
  'Proud of you — keep it up 💪',
  'Dinner in 15 🍝',
  'Time to wrap up screens for tonight 🌙',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  parentId: string;
  kidId: string;
  kidName: string;
  kidPushToken?: string | null;
  /** Pre-filled message, e.g. when nudging about one assignment */
  initialMessage?: string;
}

export default function NudgeSheet({ visible, onClose, parentId, kidId, kidName, kidPushToken, initialMessage }: Props) {
  const [message, setMessage] = useState(initialMessage ?? PRESETS[0]);
  useEffect(() => { if (visible) setMessage(initialMessage ?? PRESETS[0]); }, [visible, initialMessage]);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const isDemo = !parentId || kidId === 'demo';

  async function send() {
    const text = message.trim();
    if (!text) return;
    if (isDemo) { setStatus('sent'); setTimeout(close, 1200); return; }
    setStatus('sending');
    const ok = await sendNudge(parentId, kidId, text);
    if (!ok) { setStatus('error'); return; }
    if (kidPushToken) sendExpoPush(kidPushToken, '👋 From your parent', text);
    setStatus('sent');
    setTimeout(close, 1200);
  }

  function close() { setStatus('idle'); setMessage(PRESETS[0]); onClose(); }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={styles.head}>
            <SerifTitle size={24}>{`Nudge ${kidName}.`}</SerifTitle>
            <TouchableOpacity onPress={close} accessibilityLabel="Close"><Text style={[styles.close, { color: theme.soft }]}>×</Text></TouchableOpacity>
          </View>
          <Text style={[styles.sub, { fontFamily: theme.fBody, color: theme.sub }]}>
            Shows as a banner in {kidName}’s app, and as a notification on their phone if notifications are on.
          </Text>
          <View style={styles.presets}>
            {PRESETS.map((p) => (
              <TouchableOpacity key={p} onPress={() => setMessage(p)} style={[styles.preset, { borderColor: message === p ? theme.accent : theme.line, backgroundColor: message === p ? theme.accent + '1f' : 'transparent' }]}>
                <Text style={[styles.presetText, { fontFamily: theme.fBody, color: theme.ink }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { borderColor: theme.line, backgroundColor: theme.surface, color: theme.ink, fontFamily: theme.fBody }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Or write your own…"
            placeholderTextColor={theme.soft}
            maxLength={140}
            accessibilityLabel="Nudge message"
          />
          {status === 'error' && <Text style={[styles.err, { fontFamily: theme.fBody, color: theme.red }]}>Couldn’t send. Check your connection and try again.</Text>}
          <PrimaryBtn label={status === 'sent' ? '✓ Sent' : status === 'sending' ? 'Sending…' : 'Send nudge'} onPress={send} disabled={status === 'sending' || !message.trim()} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32, gap: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontSize: 28 },
  sub: { fontSize: 13, lineHeight: 19 },
  presets: { gap: 8 },
  preset: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  presetText: { fontSize: 15 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  err: { fontSize: 13 },
});
