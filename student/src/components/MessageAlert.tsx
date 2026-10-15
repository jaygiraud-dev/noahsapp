import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { makeTheme } from '../theme';
import { supabase } from '../lib/supabase';
import { rowToMessage } from '../lib/db';

const INBOX_POLL_MS = 15000;

/** Keeps messages coming in: realtime when it's available, a gentle poll as backup. */
export function useMessagesLive() {
  const userId = useStore((s) => s.userId);
  const userRole = useStore((s) => s.userRole);
  const loadInbox = useStore((s) => s.loadInbox);
  const receiveMessage = useStore((s) => s.receiveMessage);

  useEffect(() => {
    if (!userId || userRole !== 'student') return;
    loadInbox();
    const channel = supabase
      .channel(`messages:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` },
        (payload: any) => receiveMessage(rowToMessage(payload.new)))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` },
        (payload: any) => {
          const m = rowToMessage(payload.new);
          useStore.setState((s) => ({ messages: s.messages.map((x) => (x.id === m.id ? { ...x, readAt: m.readAt } : x)) }));
        })
      .subscribe();
    const t = setInterval(() => loadInbox(), INBOX_POLL_MS);
    return () => { clearInterval(t); supabase.removeChannel(channel); };
  }, [userId, userRole]);
}

/** "💬 Sam: hey" at the top of the screen; tap to open the chat. */
export default function MessageAlert() {
  const incoming = useStore((s) => s.incoming);
  const friends = useStore((s) => s.friends);
  const setOpenChat = useStore((s) => s.setOpenChat);
  const clearIncoming = useStore((s) => s.clearIncoming);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (!incoming) return;
    slide.setValue(-120);
    Animated.spring(slide, { toValue: 0, useNativeDriver: false, tension: 80, friction: 10 }).start();
    const t = setTimeout(() => clearIncoming(), 6000);
    return () => clearTimeout(t);
  }, [incoming?.id]);

  if (!incoming) return null;
  const name = friends.find((f) => f.id === incoming.senderId)?.name ?? 'A friend';
  const text = incoming.body || (incoming.photo ? '📷 Photo' : '');

  return (
    <Animated.View style={[styles.wrap, { top: insets.top + 6, transform: [{ translateY: slide }] }]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}
        activeOpacity={0.85}
        onPress={() => setOpenChat(incoming.senderId)}
        accessibilityRole="button"
        accessibilityLabel={`New message from ${name}: ${text}. Open chat`}
      >
        <Text style={styles.icon}>💬</Text>
        <View style={styles.text}>
          <Text style={[styles.name, { fontFamily: theme.fBodySemiBold, color: theme.ink }]} numberOfLines={1}>{name}</Text>
          <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.sub }]} numberOfLines={2}>{text}</Text>
        </View>
        <TouchableOpacity onPress={clearIncoming} accessibilityLabel="Dismiss" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.close, { color: theme.soft }]}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 200 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 14,
    maxWidth: 520, width: '100%', alignSelf: 'center',
  },
  icon: { fontSize: 22 },
  text: { flex: 1, minWidth: 0 },
  name: { fontSize: 15 },
  body: { fontSize: 15, lineHeight: 20, marginTop: 1 },
  close: { fontSize: 24, lineHeight: 26 },
});
