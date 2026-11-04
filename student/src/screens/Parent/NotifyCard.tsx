import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeTheme } from '../../theme';
import { getPushStatus, enablePush, PushStatus } from '../../lib/webPush';

type Theme = ReturnType<typeof makeTheme>;
const DISMISS_KEY = 'myagenda.notifyCardDismissed';

function dismissed(): boolean {
  try { return typeof localStorage !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}

/** Invites a parent to turn on notifications and the red number on the app icon. */
export default function NotifyCard({ theme, kidName }: { theme: Theme; kidName: string }) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [hidden, setHidden] = useState(dismissed);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { getPushStatus().then(setStatus); }, []);

  if (hidden || !status || status === 'on' || status === 'unsupported') return null;

  function notNow() {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setHidden(true);
  }

  async function turnOn() {
    setBusy(true); setMsg('');
    const r = await enablePush();
    setBusy(false);
    if (r.ok) { setStatus('on'); return; }
    setMsg(r.error === 'denied' ? 'Notifications are off for this app. You can turn them on in your phone’s Settings → Notifications → my agenda.'
      : r.error === 'not_configured' ? 'Notifications aren’t switched on for the app yet. Try again soon.'
      : 'Couldn’t turn them on. Try again in a moment.');
    getPushStatus().then(setStatus);
  }

  const who = kidName || 'your kid';
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: theme.accent + '22' }]}>
          <Ionicons name="notifications" size={22} color={theme.accent} />
          <View style={[styles.dot, { backgroundColor: theme.red, borderColor: theme.surface }]}><Text style={styles.dotText}>3</Text></View>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.title, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>Know when {who} finishes homework</Text>
          <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.sub }]}>
            {status === 'needs_home_screen'
              ? 'Save my agenda to your Home Screen first (Share → Add to Home Screen), then open it from there to turn on notifications and the red number on the app icon.'
              : status === 'blocked'
                ? 'Notifications are blocked for this app. Turn them on in your phone’s Settings → Notifications → my agenda.'
                : 'Get a heads-up when they finish something, and a red number on the app icon showing how much they’ve done since you last checked.'}
          </Text>
        </View>
      </View>
      {msg !== '' && <Text style={[styles.body, { fontFamily: theme.fBody, color: theme.red }]}>{msg}</Text>}
      <View style={styles.actions}>
        {status === 'off' && (
          <TouchableOpacity onPress={turnOn} disabled={busy} style={[styles.primary, { backgroundColor: theme.accent }]} accessibilityRole="button">
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryText, { fontFamily: theme.fBodySemiBold }]}>Turn on</Text>}
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={notNow} style={styles.secondary} accessibilityRole="button">
          <Text style={[styles.secondaryText, { fontFamily: theme.fBodyMedium, color: theme.sub }]}>Not now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconWrap: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  dot: { position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  dotText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 21 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  primary: { borderRadius: 999, paddingHorizontal: 20, height: 44, justifyContent: 'center', minWidth: 110, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16 },
  secondary: { paddingHorizontal: 8, height: 44, justifyContent: 'center' },
  secondaryText: { fontSize: 15 },
});
