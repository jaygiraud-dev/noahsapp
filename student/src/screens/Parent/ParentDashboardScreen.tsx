import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useParentStore } from '../../store/useParentStore';
import FloatingParticles from '../../components/FloatingParticles';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { lookupStudentByCode, createParentLink, fetchLinkedStudents, fetchStudentData, sendNudge, deleteParentLink, WeekStats } from '../../lib/db';
import { Homework, CalEvent } from '../../types';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayLabel(dateStr: string, today: Date): string {
  const d = new Date(dateStr);
  if (isSameDay(d, today)) return 'Today';
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(d, tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDueDate(dateStr: string, today: Date): string {
  const d = new Date(dateStr);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return `in ${diff} days`;
}

interface StudentSnapshot {
  studentUserId: string;
  name: string;
  school: string;
  homework: Homework[];
  events: CalEvent[];
  weekStats: WeekStats;
}

function PairKidCard({
  theme,
  cardSurface,
  hasLinked,
  parentUserId,
  onLinked,
}: {
  theme: ReturnType<typeof makeTheme>;
  cardSurface: string;
  hasLinked: boolean;
  parentUserId: string;
  onLinked: () => void;
}) {
  const addLinkedKid = useParentStore((s) => s.addLinkedKid);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePair() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    if (!parentUserId) {
      setError('You must be signed in to link a student.');
      return;
    }
    setLoading(true);
    setError('');

    const student = await lookupStudentByCode(trimmed);
    setLoading(false);
    if (!student) {
      setError('Code not found. Ask your child to check their pairing code in Me → Pair with Parent.');
      return;
    }
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
    onLinked();
  }

  return (
    <View style={[styles.pairCard, { backgroundColor: cardSurface, borderColor: theme.line }]}>
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
  const setLinkedKids = useParentStore((s) => s.setLinkedKids);
  const addLinkedKid = useParentStore((s) => s.addLinkedKid);
  const removeLinkedKid = useParentStore((s) => s.removeLinkedKid);
  const addNotifications = useParentStore((s) => s.addNotifications);
  const notifications = useParentStore((s) => s.notifications);
  const setPhase = useStore((s) => s.setPhase);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const bgImageUri = useStore((s) => s.bgImageUri);
  const theme = makeTheme(vibe, darkMode);
  const hasBg = bgImageUri !== '';
  const cardSurface = hasBg ? 'rgba(20,20,20,0.78)' : theme.surface;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [parentUserId, setParentUserId] = useState('');
  const [snapshots, setSnapshots] = useState<Record<string, StudentSnapshot>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [linkVersion, setLinkVersion] = useState(0);
  const [nudgeSent, setNudgeSent] = useState<Record<string, boolean>>({});
  const realtimeRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setParentUserId(data.user?.id ?? '');
    });
  }, []);

  // Fetch linked students from Supabase and REPLACE local state — always, even if empty
  useEffect(() => {
    if (!parentUserId) return;
    fetchLinkedStudents(parentUserId).then((links) => {
      const freshKids = links.map((link) => ({
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
      }));
      // Always replace — wipes demo kids and stale accounts even if Supabase returns []
      setLinkedKids(freshKids);
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
        weekStats: data.weekStats,
      };

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

  // Real-time: re-load when student's homework changes
  useEffect(() => {
    const realKids = linkedKids.filter((k) => k.studentUserId && k.studentUserId !== '');
    if (realKids.length === 0) return;

    realtimeRef.current?.unsubscribe();
    const channel = supabase
      .channel('parent-hw-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework' }, () => {
        loadSnapshots();
      })
      .subscribe();
    realtimeRef.current = channel;

    return () => { channel.unsubscribe(); };
  }, [linkedKids.length]);

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
    const weekStats = snap?.weekStats;

    // Upcoming homework: from the start of today through the next 7 days, sorted by due date
    const startOfToday = new Date(today); startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysOut = new Date(startOfToday); sevenDaysOut.setDate(startOfToday.getDate() + 8);
    const upcomingHw = hw
      .filter((h) => h.dueDate && new Date(h.dueDate) >= startOfToday && new Date(h.dueDate) < sevenDaysOut)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    // Group by day label
    const hwByDay: Record<string, Homework[]> = {};
    upcomingHw.forEach((h) => {
      const label = dayLabel(h.dueDate!, today);
      if (!hwByDay[label]) hwByDay[label] = [];
      hwByDay[label].push(h);
    });
    const dayOrder = Object.keys(hwByDay);

    const eventsToday = evs.filter((e) => e.date && isSameDay(new Date(e.date), today));
    const totalPoints = isReal ? hw.filter((h) => h.done).reduce((s, h) => s + (h.points ?? 10), 0) : kid.points;
    const completionPct = weekStats && weekStats.totalThisWeek > 0
      ? Math.round((weekStats.completedThisWeek / weekStats.totalThisWeek) * 100)
      : null;

    return (
      <View key={kid.id} style={[styles.kidCard, { backgroundColor: cardSurface, borderColor: theme.line }]}>
        {/* Header */}
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
          {isReal && snap === undefined && <ActivityIndicator size="small" color={theme.soft} />}
          <TouchableOpacity
            onPress={() => {
              removeLinkedKid(kid.id);
              if (parentUserId && kid.studentUserId) deleteParentLink(parentUserId, kid.studentUserId).catch(() => {});
            }}
            style={styles.unlinkBtn}
          >
            <Text style={[styles.unlinkText, { color: theme.soft }]}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.accent }]}>{totalPoints.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>total pts</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.mint }]}>
              {completionPct !== null ? `${completionPct}%` : '—'}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>this week</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { fontFamily: theme.fMono, color: eventsToday.length > 0 ? theme.purple : theme.soft }]}>
              {eventsToday.length}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>events today</Text>
          </View>
        </View>

        {/* Weekly Report Card */}
        {weekStats && (weekStats.totalThisWeek > 0 || weekStats.upcomingTests.length > 0) && (
          <View style={[styles.reportCard, { backgroundColor: theme.surfaceHi, borderColor: theme.line }]}>
            <Text style={[styles.reportTitle, { fontFamily: theme.fMono, color: theme.sub }]}>📋 WEEKLY SNAPSHOT</Text>
            <View style={styles.reportRow}>
              <View style={[styles.reportProgressTrack, { backgroundColor: theme.line }]}>
                <LinearGradient
                  colors={theme.accentGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.reportProgressFill, { width: `${completionPct ?? 0}%` as any }]}
                />
              </View>
              <Text style={[styles.reportStat, { fontFamily: theme.fMono, color: theme.ink }]}>
                {weekStats.completedThisWeek}/{weekStats.totalThisWeek} done · {weekStats.pointsThisWeek} pts earned
              </Text>
            </View>
            {weekStats.upcomingTests.length > 0 && (
              <View style={styles.testsWrap}>
                <Text style={[styles.testsLabel, { fontFamily: theme.fMono, color: theme.amber }]}>⚠️ COMING UP</Text>
                {weekStats.upcomingTests.map((t, i) => (
                  <View key={i} style={styles.testItem}>
                    <View style={[styles.testDot, { backgroundColor: t.classColor ?? theme.amber }]} />
                    <Text style={[styles.testText, { fontFamily: theme.fBody, color: theme.ink }]}>
                      {t.title}
                      {t.dueDate ? ` · ${formatDueDate(t.dueDate, today)}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Upcoming Homework — next 7 days */}
        <View style={styles.hwSection}>
          <View style={styles.hwLabelRow}>
            <Text style={[styles.hwLabel, { fontFamily: theme.fMono, color: theme.sub }]}>UPCOMING HOMEWORK</Text>
            <Text style={[styles.hwCount, { fontFamily: theme.fMono, color: theme.soft }]}>next 7 days</Text>
          </View>

          {dayOrder.length === 0 ? (
            <Text style={[styles.noHw, { fontFamily: theme.fMono, color: theme.soft }]}>
              {isReal && snap === undefined ? 'Loading...' : 'Nothing due in the next 7 days 🎉'}
            </Text>
          ) : (
            dayOrder.map((label) => (
              <View key={label} style={styles.dayGroup}>
                <Text style={[styles.dayGroupLabel, { fontFamily: theme.fMono, color: theme.accent }]}>{label}</Text>
                {hwByDay[label].map((h) => (
                  <View key={h.id} style={[styles.hwItem, { borderLeftColor: h.classColor ?? theme.accent }]}>
                    <View style={styles.hwItemTop}>
                      <Text style={[styles.hwItemTitle, { fontFamily: theme.fBody, color: h.done ? theme.soft : theme.ink, textDecorationLine: h.done ? 'line-through' : 'none' }]}>
                        {h.title}
                      </Text>
                      <Text style={[styles.hwItemStatus, { fontFamily: theme.fMono, color: h.done ? theme.mint : theme.soft }]}>
                        {h.done ? '✓' : '○'}
                      </Text>
                    </View>
                    <View style={styles.hwItemMeta}>
                      {h.subject && <Text style={[styles.hwItemSub, { fontFamily: theme.fMono, color: h.classColor ?? theme.accent }]}>{h.subject}</Text>}
                      {h.tag && <Text style={[styles.hwItemTag, { fontFamily: theme.fMono, color: theme.soft }]}>· {h.tag}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Today's Events */}
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

        {/* Actions */}
        {isReal && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.nudgeBtn, { borderColor: theme.accent }]}
              onPress={() => {
                if (nudgeSent[kid.studentUserId]) return;
                sendNudge(parentUserId, kid.studentUserId, "How's the homework going? 👋");
                setNudgeSent((prev) => ({ ...prev, [kid.studentUserId]: true }));
                setTimeout(() => setNudgeSent((prev) => ({ ...prev, [kid.studentUserId]: false })), 2000);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.nudgeBtnText, { fontFamily: theme.fMono, color: nudgeSent[kid.studentUserId] ? theme.mint : theme.accent }]}>
                {nudgeSent[kid.studentUserId] ? '✓ Nudge sent!' : 'Nudge 👋'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.activityBtn, { borderColor: theme.line }]} onPress={() => navigation.navigate('ParentActivity')}>
              <Text style={[styles.activityBtnText, { fontFamily: theme.fMono, color: theme.soft }]}>Activity →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: hasBg ? 'transparent' : theme.bg }]} edges={['top']}>
      {/* Ambient glow — only when no photo bg */}
      {!hasBg && (
        <LinearGradient
          colors={[theme.accent + '38', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.65 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      )}
      {/* Floating particles */}
      <FloatingParticles color={theme.accent} />
      {hasBg && (
        <ImageBackground
          source={{ uri: bgImageUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        >
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />
        </ImageBackground>
      )}
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
        {linkedKids.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyIcon]}>👨‍👩‍👧</Text>
            <Text style={[styles.emptyTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Link your first student</Text>
            <Text style={[styles.emptySub, { fontFamily: theme.fBody, color: theme.soft }]}>
              Enter your child's pairing code below to see their homework, events, and weekly progress.
            </Text>
          </View>
        )}
        {linkedKids.map(renderKidCard)}
        <PairKidCard
          theme={theme}
          cardSurface={cardSurface}
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
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 22 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
  kidCard: { borderRadius: 32, borderWidth: 0, padding: 16, gap: 16 },
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
  reportCard: { borderRadius: 20, borderWidth: 0, padding: 14, gap: 10 },
  reportTitle: { fontSize: 10, letterSpacing: 1 },
  reportRow: { gap: 6 },
  reportProgressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  reportProgressFill: { height: 6, borderRadius: 3 },
  reportStat: { fontSize: 13, letterSpacing: 0.3 },
  testsWrap: { gap: 6, paddingTop: 4 },
  testsLabel: { fontSize: 10, letterSpacing: 1 },
  testItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  testDot: { width: 8, height: 8, borderRadius: 4 },
  testText: { fontSize: 13, flex: 1, lineHeight: 18 },
  hwSection: { gap: 8 },
  hwLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  hwLabel: { fontSize: 10, letterSpacing: 1 },
  hwCount: { fontSize: 10, letterSpacing: 0.5 },
  dayGroup: { gap: 6, marginBottom: 4 },
  dayGroupLabel: { fontSize: 11, letterSpacing: 0.5, fontWeight: '600', marginTop: 4 },
  hwItem: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, gap: 3 },
  hwItemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  hwItemTitle: { fontSize: 14, lineHeight: 18, flex: 1 },
  hwItemStatus: { fontSize: 14, lineHeight: 18 },
  hwItemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hwItemSub: { fontSize: 10, letterSpacing: 0.3 },
  hwItemTag: { fontSize: 10 },
  noHw: { fontSize: 12, letterSpacing: 0.5, textAlign: 'center', paddingVertical: 12 },
  evItem: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, flexDirection: 'row', gap: 10, alignItems: 'center' },
  evTime: { fontSize: 12, letterSpacing: 0.3, minWidth: 56 },
  evTitle: { fontSize: 14, flex: 1 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  nudgeBtn: { flex: 1, borderRadius: 28, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  nudgeBtnText: { fontSize: 13, letterSpacing: 0.5 },
  activityBtn: { flex: 1, borderRadius: 28, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  activityBtnText: { fontSize: 13, letterSpacing: 0.5 },
  pairCard: { borderRadius: 32, borderWidth: 0, padding: 20, gap: 12 },
  pairTitle: { fontSize: 22 },
  pairHint: { fontSize: 14, lineHeight: 20 },
  pairRow: { flexDirection: 'row', gap: 10 },
  pairInput: { flex: 1, borderRadius: 32, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, letterSpacing: 4, textAlign: 'center' },
  pairBtn: { borderRadius: 32, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', minWidth: 64 },
  pairBtnText: { color: '#fff', fontSize: 14, letterSpacing: 0.5 },
  pairError: { fontSize: 13, lineHeight: 18 },
});
