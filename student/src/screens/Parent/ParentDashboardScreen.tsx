import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useParentStore } from '../../store/useParentStore';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { lookupStudentByCode, createParentLink, fetchLinkedStudents, fetchStudentData } from '../../lib/db';
import { Homework, CalEvent } from '../../types';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface StudentSnapshot {
  studentUserId: string;
  name: string;
  school: string;
  homework: Homework[];
  events: CalEvent[];
}

function PairKidCard({
  theme,
  hasLinked,
  parentUserId,
  onLinked,
}: {
  theme: ReturnType<typeof makeTheme>;
  hasLinked: boolean;
  parentUserId: string;
  onLinked: () => void;
}) {
  const pairKid = useParentStore((s) => s.pairKid);
  const addLinkedKid = useParentStore((s) => s.addLinkedKid);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePair() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');

    if (parentUserId) {
      const student = await lookupStudentByCode(trimmed);
      if (student) {
        const displayName = student.display_name ?? 'Student';
        await createParentLink(parentUserId, student.id, trimmed, displayName);
        addLinkedKid({
          id: student.id,
          studentUserId: student.id,
          name: displayName,
          pairingCode: trimmed,
          school: student.school_name ?? '',
          grade: '',
          points: 0,
          streak: 0,
          homeworkDue: 0,
          homeworkDone: 0,
          eventsToday: 0,
          lastActive: 'just now',
        });
        setCode('');
        setLoading(false);
        onLinked();
        return;
      }
    }

    const success = pairKid(trimmed);
    setLoading(false);
    if (!success) {
      setError('Code not found. Ask your child to check their pairing code in the app under Me → Pair with Parent.');
    } else {
      setCode('');
      onLinked();
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
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={[styles.pairBtnText, { fontFamily: theme.fMono }]}>Link</Text>}
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
  const addLinkedKid = useParentStore((s) => s.addLinkedKid);
  const removeLinkedKid = useParentStore((s) => s.removeLinkedKid);
  const addNotifications = useParentStore((s) => s.addNotifications);
  const notifications = useParentStore((s) => s.notifications);
  const setPhase = useStore((s) => s.setPhase);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [parentUserId, setParentUserId] = useState('');
  const [snapshots, setSnapshots] = useState<Record<string, StudentSnapshot>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [linkVersion, setLinkVersion] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setParentUserId(data.user?.id ?? '');
    });
  }, []);

  useEffect(() => {
    if (!parentUserId) return;
    fetchLinkedStudents(parentUserId).then((links) => {
      links.forEach((link) => {
        addLinkedKid({
          id: link.student_id,
          studentUserId: link.student_id,
          name: link.student_name ?? 'Student',
          pairingCode: link.pairing_code,
          school: '',
          grade: '',
          points: 0,
          streak: 0,
          homeworkDue: 0,
          homeworkDone: 0,
          eventsToday: 0,
          lastActive: 'recently',
        });
      });
    });
  }, [parentUserId]);

  const loadSnapshots = useCallback(async () => {
    const realKids = linkedKids.filter((k) => k.studentUserId && k.studentUserId !== '');
    if (realKids.length === 0) return;
    const results = await Promise.all(
      realKids.map(async (kid) => {
        const data = await fetchStudentData(kid.studentUserId);
        return { kid, data };
      })
    );
    const next: Record<string, StudentSnapshot> = {};
    const newNotifs: import('../../store/useParentStore').ParentNotif[] = [];
    const now = new Date();

    results.forEach(({ kid, data }) => {
      const name = data.profile?.display_name ?? kid.name;
      next[kid.studentUserId] = {
        studentUserId: kid.studentUserId,
        name,
        school: data.profile?.school_name ?? kid.school,
        homework: data.homework,
        events: data.events,
      };

      // Generate notifications from student's homework
      data.homework.forEach((hw) => {
        if (hw.done) {
          newNotifs.push({
            id: `done-${hw.id}`,
            kidId: kid.studentUserId,
            type: 'hw_done',
            text: `${name} finished ${hw.subject ? hw.subject + ' — ' : ''}${hw.title}`,
            time: hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : 'recently',
            read: false,
          });
        } else if (hw.dueDate) {
          const due = new Date(hw.dueDate);
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 1 && diffDays >= -1) {
            newNotifs.push({
              id: `due-${hw.id}`,
              kidId: kid.studentUserId,
              type: 'hw_due',
              text: `${hw.subject ? hw.subject + ': ' : ''}${hw.title} due ${diffDays <= 0 ? 'today' : 'tomorrow'}`,
              time: diffDays <= 0 ? 'today' : 'tomorrow',
              read: false,
            });
          }
        }
      });

      // Generate notifications from upcoming events
      data.events.forEach((ev) => {
        if (!ev.date) return;
        const evDate = new Date(ev.date);
        const diffDays = Math.ceil((evDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 2) {
          newNotifs.push({
            id: `event-${ev.id}`,
            kidId: kid.studentUserId,
            type: 'event',
            text: `${name} has ${ev.title} ${diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : 'in 2 days'}`,
            time: diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : 'in 2 days',
            read: false,
          });
        }
      });
    });

    setSnapshots(next);
    if (newNotifs.length > 0) addNotifications(newNotifs);
  }, [linkedKids, addNotifications]);

  useEffect(() => {
    loadSnapshots();
  }, [linkVersion, linkedKids.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSnapshots();
    setRefreshing(false);
  }, [loadSnapshots]);

  const today = new Date();

  function renderKidCard(kid: typeof linkedKids[0]) {
    const isReal = !!kid.studentUserId && kid.studentUserId !== '';
    const snap = isReal ? snapshots[kid.studentUserId] : null;
    const hw = snap?.homework ?? [];
    const evs = snap?.events ?? [];
    const school = snap?.school ?? kid.school;
    const name = snap?.name ?? kid.name;
    const hwDueToday = hw.filter((h) => h.dueDate && isSameDay(new Date(h.dueDate), today));
    const hwDone = hwDueToday.filter((h) => h.done).length;
    const eventsToday = evs.filter((e) => e.date && isSameDay(new Date(e.date), today));
    const hwPct = hwDueToday.length > 0 ? (hwDone / hwDueToday.length) * 100 : 0;
    const points = isReal ? hw.filter((h) => h.done).reduce((s, h) => s + (h.points ?? 10), 0) : kid.points;

    return (
      <View key={kid.id} style={[styles.kidCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.kidHeader}>
          <LinearGradient colors={theme.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.kidAvatar}>
            <Text style={[styles.kidInitial, { fontFamily: theme.fDisplayItalic }]}>{name[0]}</Text>
          </LinearGradient>
          <View style={styles.kidInfo}>
            <Text style={[styles.kidName, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>{name}</Text>
            <Text style={[styles.kidSchool, { fontFamily: theme.fMono, color: theme.soft }]}>
              {school || 'School not set'}
            </Text>
          </View>
          {isReal && snap === undefined && (
            <ActivityIndicator size="small" color={theme.soft} />
          )}
          <TouchableOpacity onPress={() => removeLinkedKid(kid.id)} style={styles.unlinkBtn}>
            <Text style={[styles.unlinkText, { color: theme.soft }]}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.accent }]}>{points.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>pts</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.amber }]}>{kid.streak}🔥</Text>
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

        <View style={styles.hwSection}>
          <View style={styles.hwLabelRow}>
            <Text style={[styles.hwLabel, { fontFamily: theme.fMono, color: theme.sub }]}>HOMEWORK TODAY</Text>
            <Text style={[styles.hwCount, { fontFamily: theme.fMono, color: theme.soft }]}>{hwDone}/{hwDueToday.length} done</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.surfaceHi }]}>
            <LinearGradient colors={theme.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${hwPct}%` as any }]} />
          </View>
          {hwDueToday.map((h) => (
            <View key={h.id} style={[styles.hwItem, { borderLeftColor: h.classColor ?? theme.accent }]}>
              <Text style={[styles.hwItemTitle, { fontFamily: theme.fBody, color: h.done ? theme.soft : theme.ink, textDecorationLine: h.done ? 'line-through' : 'none' }]}>
                {h.title}
              </Text>
              <View style={styles.hwItemMeta}>
                {h.subject && <Text style={[styles.hwItemSub, { fontFamily: theme.fMono, color: h.classColor ?? theme.accent }]}>{h.subject}</Text>}
                {h.tag && <Text style={[styles.hwItemTag, { fontFamily: theme.fMono, color: theme.soft }]}>· {h.tag}</Text>}
                <Text style={[styles.hwItemDone, { fontFamily: theme.fMono, color: h.done ? theme.mint : theme.soft }]}>{h.done ? '✓ done' : '○ pending'}</Text>
              </View>
            </View>
          ))}
          {hwDueToday.length === 0 && (
            <Text style={[styles.noHw, { fontFamily: theme.fMono, color: theme.soft }]}>No homework due today</Text>
          )}
        </View>

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

        <TouchableOpacity style={[styles.activityBtn, { borderColor: theme.accent }]} onPress={() => navigation.navigate('ParentActivity')}>
          <Text style={[styles.activityBtnText, { fontFamily: theme.fMono, color: theme.accent }]}>View all activity →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={[styles.headline, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Dashboard.</Text>
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

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        {linkedKids.map(renderKidCard)}
        <PairKidCard
          theme={theme}
          hasLinked={linkedKids.length > 0}
          parentUserId={parentUserId}
          onLinked={() => setLinkVersion((v) => v + 1)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headline: { fontSize: 32, lineHeight: 38 },
  topRight: { alignItems: 'flex-end', gap: 8 },
  notifBtn: { width: 44, height: 44, borderRadius: 34, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  notifIcon: { fontSize: 20 },
  notifBadge: { position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { color: '#fff', fontSize: 10 },
  signOut: { fontSize: 11, letterSpacing: 1 },
  content: { padding: 16, gap: 16 },
  kidCard: { borderRadius: 32, borderWidth: 1, padding: 16, gap: 16 },
  kidHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  kidAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  kidInitial: { fontSize: 28, color: '#fff' },
  kidInfo: { flex: 1, gap: 2 },
  unlinkBtn: { padding: 6 },
  unlinkText: { fontSize: 26, lineHeight: 28 },
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
  activityBtn: { borderRadius: 28, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  activityBtnText: { fontSize: 13, letterSpacing: 0.5 },
  pairCard: { borderRadius: 32, borderWidth: 1, padding: 20, gap: 12 },
  pairTitle: { fontSize: 22 },
  pairHint: { fontSize: 14, lineHeight: 20 },
  pairRow: { flexDirection: 'row', gap: 10 },
  pairInput: { flex: 1, borderRadius: 32, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, letterSpacing: 4, textAlign: 'center' },
  pairBtn: { borderRadius: 32, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', minWidth: 64 },
  pairBtnText: { color: '#fff', fontSize: 14, letterSpacing: 0.5 },
  pairError: { fontSize: 13, lineHeight: 18 },
});
