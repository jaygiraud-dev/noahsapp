import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, ChatMessage } from '../../store/useStore';
import { makeTheme } from '../../theme';
import Avatar from '../../components/Avatar';
import { confirmAction } from '../../lib/confirm';
import { isSameDay } from '../../lib/time';

const POLL_MS = 4000;
const MAX_LEN = 1000;

function dayLabel(d: Date): string {
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yest)) return 'Yesterday';
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

function timeLabel(d: Date): string {
  return d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }).replace(/\./g, '').toUpperCase();
}

/** Full-screen chat with one friend. Opens whenever `openChatWith` is set in the store. */
export default function ChatSheet() {
  const friendId = useStore((s) => s.openChatWith);
  const setOpenChat = useStore((s) => s.setOpenChat);
  const friends = useStore((s) => s.friends);
  const userId = useStore((s) => s.userId);
  const allMessages = useStore((s) => s.messages);
  const status = useStore((s) => s.messagingStatus);
  const sendChat = useStore((s) => s.sendChat);
  const retryChat = useStore((s) => s.retryChat);
  const unsendMessage = useStore((s) => s.unsendMessage);
  const loadConversation = useStore((s) => s.loadConversation);
  const loadFriends = useStore((s) => s.loadFriends);
  const [checkingFriends, setCheckingFriends] = useState(false);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const friend = friends.find((f) => f.id === friendId);
  // While the friends list refreshes, assume they're still friends
  const stillFriends = !!friend || checkingFriends;
  const name = friend?.name ?? 'Friend';
  const messages = allMessages.filter((m) =>
    (m.senderId === userId && m.recipientId === friendId) || (m.senderId === friendId && m.recipientId === userId));
  const lastMine = [...messages].reverse().find((m) => m.senderId === userId && !m.pending);

  // Realtime handles most updates; this keeps the chat fresh if it drops
  useEffect(() => {
    if (!friendId) return;
    setDraft('');
    setCheckingFriends(true);
    loadFriends().finally(() => setCheckingFriends(false));
    const t = setInterval(() => loadConversation(friendId), POLL_MS);
    return () => clearInterval(t);
  }, [friendId]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length, friendId]);

  function send() {
    const text = draft.trim();
    if (!text || !stillFriends) return;
    setDraft('');
    sendChat(friendId, text);
  }

  function onLongPress(m: ChatMessage) {
    if (m.senderId !== userId) return;
    confirmAction('Unsend message?', `“${m.body.slice(0, 80)}” will be removed for both of you.`, 'Unsend', () => unsendMessage(m.id));
  }

  const canSend = stillFriends && status !== 'needs_update' && draft.trim().length > 0;

  return (
    <Modal visible={!!friendId} animationType="slide" onRequestClose={() => setOpenChat('')}>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.header, { borderBottomColor: theme.line }]}>
            <TouchableOpacity onPress={() => setOpenChat('')} style={styles.back} accessibilityLabel="Back to squad" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.backText, { color: theme.accent }]}>‹</Text>
            </TouchableOpacity>
            <Avatar uri={friend?.avatar} name={name} size={38} colors={[friend?.color ?? theme.accent, (friend?.color ?? theme.accent) + 'aa']} fontFamily={theme.fDisplayItalic} />
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { fontFamily: theme.fBodySemiBold, color: theme.ink }]} numberOfLines={1}>{name}</Text>
              <Text style={[styles.headerSub, { fontFamily: theme.fBody, color: theme.soft }]} numberOfLines={1}>🔒 Only you two can see this chat</Text>
            </View>
          </View>

          <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {status === 'needs_update' && (
              <View style={[styles.notice, { backgroundColor: theme.amber + '22', borderColor: theme.amber }]}>
                <Text style={[styles.noticeText, { fontFamily: theme.fBody, color: theme.ink }]}>
                  Messaging isn’t switched on yet. The app’s database update needs to be run first (supabase_messages.sql).
                </Text>
              </View>
            )}
            {messages.length === 0 && status !== 'needs_update' && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>👋</Text>
                <Text style={[styles.emptyText, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Say hi to {name}.</Text>
              </View>
            )}
            {messages.map((m, i) => {
              const mine = m.senderId === userId;
              const d = new Date(m.createdAt);
              const prev = messages[i - 1];
              const newDay = !prev || !isSameDay(new Date(prev.createdAt), d);
              const color = mine ? theme.accent : theme.surface;
              return (
                <View key={m.id}>
                  {newDay && <Text style={[styles.day, { fontFamily: theme.fMono, color: theme.soft }]}>{dayLabel(d)}</Text>}
                  <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onLongPress={() => onLongPress(m)}
                      onPress={() => (m.pending === 'failed' ? retryChat(m.id) : undefined)}
                      style={[styles.bubble, { backgroundColor: color, opacity: m.pending === 'sending' ? 0.6 : 1 }, mine ? styles.bubbleMine : styles.bubbleTheirs]}
                      accessibilityLabel={`${mine ? 'You' : name}: ${m.body}`}
                      accessibilityHint={mine ? 'Long press to unsend' : undefined}
                    >
                      <Text style={[styles.body, { fontFamily: theme.fBody, color: mine ? '#fff' : theme.ink }]}>{m.body}</Text>
                      <Text style={[styles.time, { fontFamily: theme.fBody, color: mine ? 'rgba(255,255,255,0.75)' : theme.soft }]}>{timeLabel(d)}</Text>
                    </TouchableOpacity>
                  </View>
                  {m.pending === 'failed' && (
                    <TouchableOpacity onPress={() => retryChat(m.id)} style={styles.failRow} accessibilityRole="button">
                      <Text style={[styles.fail, { fontFamily: theme.fBody, color: theme.red }]}>Not sent · tap to try again</Text>
                    </TouchableOpacity>
                  )}
                  {lastMine && m.id === lastMine.id && (
                    <Text style={[styles.receipt, { fontFamily: theme.fBody, color: theme.soft }]}>{m.readAt ? 'Seen' : 'Sent'}</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {stillFriends ? (
            <View style={[styles.inputRow, { borderTopColor: theme.line, backgroundColor: theme.bg }]}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
                value={draft}
                onChangeText={setDraft}
                placeholder={`Message ${name}`}
                placeholderTextColor={theme.soft}
                multiline
                maxLength={MAX_LEN}
                onKeyPress={(e: any) => {
                  // Enter sends on the web; Shift+Enter makes a new line
                  if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) { e.preventDefault?.(); send(); }
                }}
                accessibilityLabel={`Type a message to ${name}`}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: canSend ? theme.accent : theme.line }]}
                onPress={send}
                disabled={!canSend}
                accessibilityLabel="Send"
              >
                <Text style={styles.sendIcon}>↑</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.gone, { fontFamily: theme.fBody, color: theme.soft, borderTopColor: theme.line }]}>
              You’re not friends any more, so new messages can’t be sent.
            </Text>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { paddingHorizontal: 4 },
  backText: { fontSize: 34, lineHeight: 36 },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 17 },
  headerSub: { fontSize: 12, marginTop: 1 },
  list: { padding: 14, gap: 4, flexGrow: 1 },
  notice: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  noticeText: { fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 22 },
  day: { textAlign: 'center', fontSize: 12, letterSpacing: 0.5, marginVertical: 10 },
  row: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, gap: 2 },
  bubbleMine: { borderBottomRightRadius: 6 },
  bubbleTheirs: { borderBottomLeftRadius: 6 },
  body: { fontSize: 16, lineHeight: 22 },
  time: { fontSize: 11, alignSelf: 'flex-end' },
  failRow: { alignSelf: 'flex-end', paddingVertical: 2 },
  fail: { fontSize: 12 },
  receipt: { alignSelf: 'flex-end', fontSize: 12, marginTop: 2, marginRight: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, minWidth: 0, maxHeight: 120, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 16 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: -2 },
  gone: { textAlign: 'center', fontSize: 14, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
