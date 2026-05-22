import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useParentStore } from '../../store/useParentStore';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function PairKidCard({ theme, hasLinked }: { theme: ReturnType<typeof makeTheme>; hasLinked: boolean }) {
  const pairKid = useParentStore((s) => s.pairKid);
  const pairingCode = useStore((s) => s.pairingCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handlePair() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    // Try the live student store's pairing code first, then fall back to sample
    const success = trimmed === pairingCode.toUpperCase() ? pairKid(pairingCode) : pairKid(trimmed);
    if (!success) {
      setError('Code not found. Ask your child to check their pairing code in the app under Me → Pair with Parent.');
    }
  }

  return (
    <View style={[styles.pairCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.pairTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
        {hasLinked ? 'Link another student' : 'Link a student'}
      </Text>
      <Text style={[styles.pairHint, { fontFamily: theme.fBody, color: theme.sub }]}>
        Ask your child for their 6-digit pairing code. They can find it in the app under Me → Pair with Parent.
      </Text>
      <View style={styles.pairRow}>
        <TextInput
          style={[styles.pairInput, { backgroundColor: theme.surfaceHi, borderColor: error ? theme.red : theme.line, color: theme.ink, fontFamily: theme.fMono }]}
          value={code}
          onChangeText={(v) => { setCode(v.toUpperCase()); setError(''); }}
          placeholder="e.g. 7K4M2D"
          placeholderTextColor={theme.soft}
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity
          style={[styles.pairBtn, { backgroundColor: theme.accent }]}
          onPress={handlePair}
        >
          <Text style={[styles.pairBtnText, { fontFamily: theme.fMono }]}>Link</Text>
        </TouchableOpacity>
      </View>
      {error !== '' && (
        <Text style={[styles.pairError, { fontFamily: theme.fBody, color: theme.red }]}>{error}</Text>
      )}
    </View>
  );
}

export default function ParentDashboardScreen({ navigation }: any) {
  const linkedKids = useParentStore((s) => s.linkedKids);
  const notifications = useParentStore((s) => s.notifications);
  const setPhase = useStore((s) => s.setPhase);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Live student data from the shared store
  const studentHomework = useStore((s) => s.homework);
  const studentEvents = useStore((s) => s.events);
  const studentPoints = useStore((s) => s.points);
  const studentStreak = useStore((s) => s.streak);
  const studentSchool = useStore((s) => s.school);
  const studentClasses = useStore((s) => s.classes);

  const today = new Date();
  const hwDueToday = studentHomework.filter((h) => h.dueDate && isSameDay(new Date(h.dueDate), today));
  const hwDone = hwDueToday.filter((h) => h.done).length;
  const eventsToday = studentEvents.filter((e) => e.date && isSameDay(new Date(e.date), today));
  const hwPct = hwDueToday.length > 0 ? (hwDone / hwDueToday.length) * 100 : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.topBar}>
        <View>
              <Text style={[styles.headline, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Dashboard.</Text>
        </View>
        <View style={styles.topRight}>
          {linkedKids.length > 0 && (
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
              onPress={() => navigation.navigate('ParentActivity')}
            >
              <Text style={[styles.notifIcon, { color: unreadCount > 0 ? theme.magenta : theme.soft }]}>🔔</Text>
              {unreadCount > 0 && (
                <View style={[styles.notifBadge, { backgroundColor: theme.magenta }]}>
                  <Text style={[styles.notifBadgeText, { fontFamily: theme.fMono }]}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={async () => { await supabase.auth.signOut(); setPhase('auth'); }}>
            <Text style={[styles.signOut, { fontFamily: theme.fMono, color: theme.soft }]}>sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {linkedKids.map((kid) => (
          <View key={kid.id} style={[styles.kidCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            {/* Header */}
            <View style={styles.kidHeader}>
              <LinearGradient colors={theme.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.kidAvatar}>
                <Text style={[styles.kidInitial, { fontFamily: theme.fDisplayItalic }]}>{kid.name[0]}</Text>
              </LinearGradient>
              <View style={styles.kidInfo}>
                <Text style={[styles.kidName, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>{kid.name}</Text>
                <Text style={[styles.kidSchool, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {studentSchool.name}  ·  {studentClasses.length} classes
                </Text>
              </View>
            </View>

            {/* Live stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.accent }]}>{studentPoints.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>pts</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.amber }]}>{studentStreak}🔥</Text>
                <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>streak</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { fontFamily: theme.fMono, color: eventsToday.length > 0 ? theme.purple : theme.soft }]}>
                  {eventsToday.length}
                </Text>
                <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>events today</Text>
              </View>
            </View>

            {/* Homework progress */}
            <View style={styles.hwSection}>
              <View style={styles.hwLabelRow}>
                <Text style={[styles.hwLabel, { fontFamily: theme.fMono, color: theme.sub }]}>HOMEWORK TODAY</Text>
                <Text style={[styles.hwCount, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {hwDone}/{hwDueToday.length} done
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.surfaceHi }]}>
                <LinearGradient
                  colors={theme.accentGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${hwPct}%` as any }]}
                />
              </View>
              {/* List of today's homework */}
              {hwDueToday.map((hw) => (
                <View key={hw.id} style={[styles.hwItem, { borderLeftColor: hw.classColor ?? theme.accent }]}>
                  <Text style={[styles.hwItemTitle, { fontFamily: theme.fBody, color: hw.done ? theme.soft : theme.ink, textDecorationLine: hw.done ? 'line-through' : 'none' }]}>
                    {hw.title}
                  </Text>
                  <View style={styles.hwItemMeta}>
                    {hw.subject && (
                      <Text style={[styles.hwItemSub, { fontFamily: theme.fMono, color: hw.classColor ?? theme.accent }]}>
                        {hw.subject}
                      </Text>
                    )}
                    {hw.tag && (
                      <Text style={[styles.hwItemTag, { fontFamily: theme.fMono, color: theme.soft }]}>· {hw.tag}</Text>
                    )}
                    <Text style={[styles.hwItemDone, { fontFamily: theme.fMono, color: hw.done ? theme.mint : theme.soft }]}>
                      {hw.done ? '✓ done' : '○ pending'}
                    </Text>
                  </View>
                </View>
              ))}
              {hwDueToday.length === 0 && (
                <Text style={[styles.noHw, { fontFamily: theme.fMono, color: theme.soft }]}>No homework due today</Text>
              )}
            </View>

            {/* Today's events */}
            {eventsToday.length > 0 && (
              <View style={styles.hwSection}>
                <Text style={[styles.hwLabel, { fontFamily: theme.fMono, color: theme.sub }]}>TODAY'S EVENTS</Text>
                {eventsToday.map((ev) => (
                  <View key={ev.id} style={[styles.evItem, { borderLeftColor: theme.purple }]}>
                    <Text style={[styles.evTime, { fontFamily: theme.fMono, color: theme.purple }]}>{ev.time}</Text>
                    <Text style={[styles.evTitle, { fontFamily: theme.fBody, color: theme.ink }]}>{ev.title}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.activityBtn, { borderColor: theme.accent }]}
              onPress={() => navigation.navigate('ParentActivity')}
            >
              <Text style={[styles.activityBtnText, { fontFamily: theme.fMono, color: theme.accent }]}>
                View all activity →
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <PairKidCard theme={theme} hasLinked={linkedKids.length > 0} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  appName: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  headline: { fontSize: 32, lineHeight: 38 },
  topRight: { alignItems: 'flex-end', gap: 8 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  notifIcon: { fontSize: 20 },
  notifBadge: { position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { color: '#fff', fontSize: 10 },
  signOut: { fontSize: 11, letterSpacing: 1 },
  content: { padding: 16, gap: 16 },
  kidCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 16 },
  kidHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  kidAvatar: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  kidInitial: { fontSize: 28, color: '#fff' },
  kidInfo: { flex: 1, gap: 2 },
  kidName: { fontSize: 18 },
  kidSchool: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 20, letterSpacing: 0.5 },
  statLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 32 },
  hwSection: { gap: 8 },
  hwLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  hwLabel: { fontSize: 10, letterSpacing: 1 },
  hwCount: { fontSize: 10, letterSpacing: 0.5 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  hwItem: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, gap: 3 },
  hwItemTitle: { fontSize: 14, lineHeight: 18 },
  hwItemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hwItemSub: { fontSize: 10, letterSpacing: 0.3 },
  hwItemTag: { fontSize: 10 },
  hwItemDone: { fontSize: 10, letterSpacing: 0.3 },
  noHw: { fontSize: 12, letterSpacing: 0.5, textAlign: 'center', paddingVertical: 8 },
  evItem: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, flexDirection: 'row', gap: 10, alignItems: 'center' },
  evTime: { fontSize: 12, letterSpacing: 0.3, minWidth: 56 },
  evTitle: { fontSize: 14, flex: 1 },
  activityBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  activityBtnText: { fontSize: 13, letterSpacing: 0.5 },
  pairCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  pairTitle: { fontSize: 22 },
  pairHint: { fontSize: 14, lineHeight: 20 },
  pairRow: { flexDirection: 'row', gap: 10 },
  pairInput: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, letterSpacing: 4, textAlign: 'center' },
  pairBtn: { borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  pairBtnText: { color: '#fff', fontSize: 14, letterSpacing: 0.5 },
  pairError: { fontSize: 13, lineHeight: 18 },
});
