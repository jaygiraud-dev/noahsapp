import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useParentStore } from '../../store/useParentStore';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { linkStudentByCode } from '../../lib/db';
import { useParentData, Kid } from '../../lib/parentData';
import { isSameDay, startOfDay, effectiveStreak, fmt12, parseTime } from '../../lib/time';
import { classesOnDate } from '../../lib/timetable';
import { getClosedReason } from '../../data/schoolCalendars';
import { eventIcon } from '../../data/constants';
import Avatar from '../../components/Avatar';
import NudgeSheet from './NudgeSheet';

type Theme = ReturnType<typeof makeTheme>;

function LinkKidCard({ theme, hasKids, isDemo, onLinked }: { theme: Theme; hasKids: boolean; isDemo: boolean; onLinked: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLink() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) { setError('Codes are 6 letters and numbers.'); return; }
    if (isDemo) { setError('This is the parent demo. Create a parent account to link your kid.'); return; }
    setLoading(true); setError(''); setOk('');
    const res = await linkStudentByCode(trimmed);
    setLoading(false);
    if (!res.ok) {
      setError(
        res.reason === 'code_not_found' ? 'No student has that code. Ask your kid to open Me in their app and read it to you.'
        : res.reason === 'not_a_parent' ? 'This account is a student account. Sign up for a separate parent account to link a kid.'
        : res.reason === 'not_signed_in' ? 'Sign in again, then try the code.'
        : 'Couldn’t reach the server. Check your connection and try again.'
      );
      return;
    }
    setCode('');
    setOk(`✓ Linked to ${res.name ?? 'your kid'}`);
    onLinked();
  }

  return (
    <View style={[styles.linkCard, { backgroundColor: theme.surface }]}>
      <Text style={[styles.linkTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{hasKids ? 'Link another kid' : 'Link your kid'}</Text>
      <Text style={[styles.linkHint, { fontFamily: theme.fBody, color: theme.sub }]}>
        Your kid finds their 6-character code in their app under Me → Parents (or on the last setup step).
      </Text>
      <View style={styles.linkRow}>
        <TextInput
          style={[styles.linkInput, { backgroundColor: theme.surfaceHi, borderColor: error ? theme.red : theme.line, color: theme.ink, fontFamily: theme.fMono }]}
          value={code}
          onChangeText={(v) => { setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(''); setOk(''); }}
          placeholder="ABC234"
          placeholderTextColor={theme.soft}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          onSubmitEditing={handleLink}
          accessibilityLabel="Your kid's code"
        />
        <TouchableOpacity style={[styles.linkBtn, { backgroundColor: theme.accent }]} onPress={handleLink} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.linkBtnText, { fontFamily: theme.fMono }]}>Link</Text>}
        </TouchableOpacity>
      </View>
      {error !== '' && <Text style={[styles.linkMsg, { fontFamily: theme.fBody, color: theme.red }]}>{error}</Text>}
      {ok !== '' && <Text style={[styles.linkMsg, { fontFamily: theme.fBody, color: theme.mint }]}>{ok}</Text>}
    </View>
  );
}

function KidCard({ kid, theme, onOpen, onNudge }: { kid: Kid; theme: Theme; onOpen: (view: 'day' | 'week') => void; onNudge: () => void }) {
  const snap = kid.snap;
  const p = snap?.profile;
  const today = new Date();
  const sod = startOfDay(today);
  const tom = new Date(sod); tom.setDate(sod.getDate() + 1);
  const hw = snap?.homework ?? [];
  const overdue = hw.filter((h) => !h.done && h.dueDate && new Date(h.dueDate) < sod);
  const dueToday = hw.filter((h) => h.dueDate && isSameDay(new Date(h.dueDate), today));
  const dueTomorrow = hw.filter((h) => !h.done && h.dueDate && isSameDay(new Date(h.dueDate), tom));
  const plansToday = (snap?.events ?? []).filter((e) => e.date && isSameDay(new Date(e.date), today))
    .sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0));
  const closed = getClosedReason(today, p?.school_name ?? undefined);
  const classesToday = closed ? [] : classesOnDate(today, p?.classes ?? [], p?.timetable, p?.school_name ?? undefined);
  const nowMin = today.getHours() * 60 + today.getMinutes();
  const inClass = classesToday.find((c) => nowMin >= parseTime(c.start)! && nowMin < parseTime(c.end)!);
  const ws = snap?.weekStats;
  const doneToday = dueToday.filter((h) => h.done).length;

  return (
    <View style={[styles.kidCard, { backgroundColor: theme.surface }]}>
      <View style={styles.kidHeader}>
        <Avatar uri={p?.avatar} name={kid.name} size={52} colors={theme.accentGrad} fontFamily={theme.fDisplayItalic} />
        <View style={styles.kidInfo}>
          <Text style={[styles.kidName, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>{kid.name}</Text>
          <Text style={[styles.kidSchool, { fontFamily: theme.fMono, color: theme.soft }]} numberOfLines={1}>
            {[p?.school_name, p?.grade ? `Grade ${p.grade}` : ''].filter(Boolean).join(' · ') || 'School not set yet'}
          </Text>
        </View>
        {!snap && <ActivityIndicator size="small" color={theme.soft} />}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.accent }]}>{(p?.points ?? 0).toLocaleString()}</Text>
          <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>POINTS</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.amber }]}>🔥{effectiveStreak(p?.streak, p?.last_activity_date)}</Text>
          <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>STREAK</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.mint }]}>{ws && ws.totalThisWeek > 0 ? `${ws.completedThisWeek}/${ws.totalThisWeek}` : '—'}</Text>
          <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>DONE THIS WEEK</Text>
        </View>
      </View>

      {/* Status lines */}
      <View style={styles.statusList}>
        {overdue.length > 0 && (
          <TouchableOpacity style={[styles.statusRow, { backgroundColor: theme.red + '1a', borderColor: theme.red + '55' }]} onPress={() => onOpen('week')}>
            <Text style={[styles.statusText, { fontFamily: theme.fBodyMedium, color: theme.red }]}>⚠ {overdue.length} overdue: {overdue.map((h) => h.title).join(', ')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.statusRow, { backgroundColor: theme.surfaceHi, borderColor: theme.line }]} onPress={() => onOpen('day')}>
          <Text style={[styles.statusText, { fontFamily: theme.fBody, color: theme.ink }]}>
            {dueToday.length === 0 ? '📚 Nothing due today' : `📚 Due today: ${doneToday} of ${dueToday.length} done`}
          </Text>
        </TouchableOpacity>
        {dueTomorrow.length > 0 && (
          <TouchableOpacity style={[styles.statusRow, { backgroundColor: theme.amber + '1a', borderColor: theme.amber + '55' }]} onPress={() => onOpen('day')}>
            <Text style={[styles.statusText, { fontFamily: theme.fBody, color: theme.amber }]}>⏰ Due tomorrow: {dueTomorrow.map((h) => h.title).join(', ')}</Text>
          </TouchableOpacity>
        )}
        {inClass && (
          <View style={[styles.statusRow, { backgroundColor: inClass.cls.color + '1a', borderColor: inClass.cls.color + '55' }]}>
            <Text style={[styles.statusText, { fontFamily: theme.fBody, color: theme.ink }]}>🏫 In {inClass.cls.name} until {fmt12(inClass.end)}</Text>
          </View>
        )}
        {closed && (
          <View style={[styles.statusRow, { backgroundColor: theme.surfaceHi, borderColor: theme.line }]}>
            <Text style={[styles.statusText, { fontFamily: theme.fBody, color: theme.sub }]}>🏫 No school today · {closed}</Text>
          </View>
        )}
        {plansToday.map((e) => (
          <View key={e.id} style={[styles.statusRow, { backgroundColor: theme.surfaceHi, borderColor: theme.line }]}>
            <Text style={[styles.statusText, { fontFamily: theme.fBody, color: theme.ink }]}>
              {e.icon ?? eventIcon(e.type)} {e.title}{e.time ? ` · ${fmt12(e.time)}${e.endTime ? `–${fmt12(e.endTime)}` : ''}` : ''}{e.location ? ` · ${e.location}` : ''}
            </Text>
          </View>
        ))}
      </View>

      {ws && ws.upcomingTests.length > 0 && (
        <View style={styles.tests}>
          <Text style={[styles.testsLabel, { fontFamily: theme.fMono, color: theme.amber }]}>TESTS & PROJECTS COMING UP</Text>
          {ws.upcomingTests.slice(0, 4).map((t, i) => (
            <Text key={i} style={[styles.testText, { fontFamily: theme.fBody, color: theme.ink }]}>
              <Text style={{ color: t.classColor ?? theme.amber }}>● </Text>
              {t.title}{t.subject ? ` · ${t.subject}` : ''}{t.dueDate ? ` · ${new Date(t.dueDate).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}` : ''}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionPrimary, { backgroundColor: theme.accent }]} onPress={() => onOpen('day')}>
          <Text style={[styles.actionPrimaryText, { fontFamily: theme.fMono }]}>Homework & schedule →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionSecondary, { borderColor: theme.accent }]} onPress={onNudge}>
          <Text style={[styles.actionSecondaryText, { fontFamily: theme.fMono, color: theme.accent }]}>Nudge 👋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ParentDashboardScreen({ navigation }: any) {
  const { kids, activity, load, reloadKid, loadActivity, loading, loaded, error, parentId } = useParentData();
  const lastSeen = useParentStore((s) => s.lastSeenActivityAt);
  const clearedBefore = useParentStore((s) => s.clearedBefore);
  const displayName = useStore((s) => s.displayName);
  const userId = useStore((s) => s.userId);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const [refreshing, setRefreshing] = useState(false);
  const [nudgeKid, setNudgeKid] = useState<Kid | null>(null);
  const isDemo = !userId;

  useEffect(() => { load(); }, [userId]);
  useEffect(() => navigation.addListener('focus', () => { if (loaded) load(); }), [navigation, loaded]);

  // Live updates while the dashboard is open, plus a slow poll as a backup
  useEffect(() => {
    if (!parentId || kids.length === 0) return;
    const ids = new Set(kids.map((k) => k.id));
    const onChange = (payload: any) => {
      const row = payload.new ?? payload.old ?? {};
      const kidId = row.user_id ?? row.student_id;
      if (kidId && ids.has(kidId)) { reloadKid(kidId); loadActivity(); }
    };
    const channel = supabase
      .channel(`parent:${parentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, onChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity' }, onChange)
      .subscribe();
    const poll = setInterval(() => { kids.forEach((k) => reloadKid(k.id)); loadActivity(); }, 60000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [parentId, kids.length]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);

  const unread = activity.filter((a) => a.createdAt > (lastSeen || '') && a.createdAt > (clearedBefore || '')).length;
  const firstName = displayName && displayName !== 'Student' ? displayName.split(' ')[0] : '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <LinearGradient colors={[theme.accent + '30', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.eyebrow, { fontFamily: theme.fMono, color: theme.accent }]}>PARENT</Text>
          <Text style={[styles.headline, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{isDemo ? 'Demo dashboard.' : firstName ? `Hi ${firstName}.` : 'Dashboard.'}</Text>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surface }]} onPress={() => navigation.navigate('ParentActivity')} accessibilityLabel={`Activity${unread ? `, ${unread} new` : ''}`}>
            <Ionicons name="notifications-outline" size={20} color={unread > 0 ? theme.accent : theme.sub} />
            {unread > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.accent }]}><Text style={[styles.badgeText, { fontFamily: theme.fMono }]}>{unread > 99 ? '99+' : unread}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surface }]} onPress={() => navigation.navigate('ParentSettings')} accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={20} color={theme.sub} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}>
        {isDemo && (
          <Text style={[styles.demoNote, { fontFamily: theme.fBody, color: theme.sub }]}>
            This demo shows the sample student’s homework. Create a parent account to see your kid’s.
          </Text>
        )}
        {loading && !loaded && <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />}
        {error !== '' && <Text style={[styles.err, { fontFamily: theme.fBody, color: theme.red }]}>{error}</Text>}
        {loaded && kids.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>👨‍👩‍👧</Text>
            <Text style={[styles.emptyTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>One step left.</Text>
            <Text style={[styles.emptySub, { fontFamily: theme.fBody, color: theme.sub }]}>
              Enter your kid’s code below to see their homework, due dates and plans. You won’t see their friends or messages.
            </Text>
          </View>
        )}
        {kids.map((k) => (
          <KidCard
            key={k.id}
            kid={k}
            theme={theme}
            onOpen={(view) => navigation.navigate('ParentKid', { kidId: k.id, view })}
            onNudge={() => setNudgeKid(k)}
          />
        ))}
        <LinkKidCard theme={theme} hasKids={kids.length > 0} isDemo={isDemo} onLinked={load} />
      </ScrollView>

      <NudgeSheet
        visible={!!nudgeKid}
        onClose={() => setNudgeKid(null)}
        parentId={parentId}
        kidId={nudgeKid?.id ?? ''}
        kidName={nudgeKid?.name ?? ''}
        kidPushToken={nudgeKid?.snap?.profile?.push_token}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { fontSize: 10, letterSpacing: 2 },
  headline: { fontSize: 34, lineHeight: 40 },
  topRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10 },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  demoNote: { fontSize: 13, lineHeight: 19, paddingHorizontal: 4 },
  err: { fontSize: 14, textAlign: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 26 },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16, maxWidth: 440 },
  kidCard: { borderRadius: 28, padding: 16, gap: 14 },
  kidHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  kidInfo: { flex: 1, gap: 2 },
  kidName: { fontSize: 19 },
  kidSchool: { fontSize: 11, letterSpacing: 0.3 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 19, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 9, letterSpacing: 1 },
  statDivider: { width: 1, height: 30 },
  statusList: { gap: 6 },
  statusRow: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  statusText: { fontSize: 14, lineHeight: 19 },
  tests: { gap: 4 },
  testsLabel: { fontSize: 10, letterSpacing: 1 },
  testText: { fontSize: 14, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionPrimary: { flex: 1.6, borderRadius: 24, paddingVertical: 12, alignItems: 'center' },
  actionPrimaryText: { color: '#fff', fontSize: 13, letterSpacing: 0.3 },
  actionSecondary: { flex: 1, borderRadius: 24, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  actionSecondaryText: { fontSize: 13, letterSpacing: 0.3 },
  linkCard: { borderRadius: 28, padding: 20, gap: 12 },
  linkTitle: { fontSize: 22 },
  linkHint: { fontSize: 14, lineHeight: 20 },
  linkRow: { flexDirection: 'row', gap: 10 },
  linkInput: { flex: 1, minWidth: 0, borderRadius: 24, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, letterSpacing: 4, textAlign: 'center' },
  linkBtn: { borderRadius: 24, paddingHorizontal: 22, justifyContent: 'center', alignItems: 'center' },
  linkBtnText: { color: '#fff', fontSize: 14 },
  linkMsg: { fontSize: 13, lineHeight: 18 },
});
