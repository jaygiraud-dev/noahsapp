import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { useParentData } from '../../lib/parentData';
import { Homework, CalEvent } from '../../types';
import { isSameDay, startOfDay, fmt12, parseTime } from '../../lib/time';
import { classesOnDate } from '../../lib/timetable';
import { getClosedReason, getDaySchedule } from '../../data/schoolCalendars';
import { eventIcon, tagIcon } from '../../data/constants';
import NudgeSheet from './NudgeSheet';

type Theme = ReturnType<typeof makeTheme>;

function status(hw: Homework): { label: string; tone: 'done' | 'overdue' | 'today' | 'soon' | 'later' } {
  const sod = startOfDay(new Date());
  const tom = new Date(sod); tom.setDate(sod.getDate() + 1);
  const due = hw.dueDate ? new Date(hw.dueDate) : null;
  if (hw.done) return { label: hw.doneAt ? `Done ${new Date(hw.doneAt).toLocaleDateString('en-CA', { weekday: 'short' })} ${new Date(hw.doneAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}` : 'Done', tone: 'done' };
  if (due && due < sod) return { label: 'Overdue', tone: 'overdue' };
  if (due && isSameDay(due, sod)) return { label: 'Due today', tone: 'today' };
  if (due && isSameDay(due, tom)) return { label: 'Due tomorrow', tone: 'soon' };
  return { label: 'Not done yet', tone: 'later' };
}

function HomeworkCard({ hw, theme, onPhoto }: { hw: Homework; theme: Theme; onPhoto: (uri: string) => void }) {
  const st = status(hw);
  const color = hw.classColor ?? theme.accent;
  const toneColor = st.tone === 'done' ? theme.mint : st.tone === 'overdue' ? theme.red : st.tone === 'soon' || st.tone === 'today' ? theme.amber : theme.sub;
  return (
    <View style={[styles.hwCard, { backgroundColor: theme.surface, borderLeftColor: color }]}>
      <View style={styles.hwTop}>
        <Text style={[styles.hwTitle, { fontFamily: theme.fBodyMedium, color: theme.ink, textDecorationLine: hw.done ? 'line-through' : 'none' }]}>{hw.title}</Text>
        <Text style={[styles.statusPill, { fontFamily: theme.fMono, color: toneColor, backgroundColor: toneColor + '1f' }]}>{st.tone === 'done' ? '✓ ' : st.tone === 'overdue' ? '⚠ ' : ''}{st.label}</Text>
      </View>
      <Text style={[styles.hwMeta, { fontFamily: theme.fMono, color: theme.soft }]}>
        {[hw.subject, hw.tag ? `${tagIcon(hw.tag)} ${hw.tag}` : '', hw.dueDate ? `Due ${new Date(hw.dueDate).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}` : ''].filter(Boolean).join('  ·  ')}
      </Text>
      {hw.notes ? <Text style={[styles.hwNotes, { fontFamily: theme.fBody, color: theme.sub }]}>{hw.notes}</Text> : null}
      {(hw.attachedImages ?? []).length > 0 && (
        <View style={styles.photoRow}>
          {hw.attachedImages!.map((uri, i) => (
            <TouchableOpacity key={i} onPress={() => onPhoto(uri)} accessibilityLabel="View photo">
              <Image source={{ uri }} style={styles.photo} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function EventRow({ ev, theme }: { ev: CalEvent; theme: Theme }) {
  return (
    <View style={[styles.evRow, { backgroundColor: theme.surface }]}>
      <Text style={styles.evIcon}>{ev.icon ?? eventIcon(ev.type)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.evTitle, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{ev.title}</Text>
        <Text style={[styles.evMeta, { fontFamily: theme.fMono, color: theme.soft }]}>
          {[ev.time ? `${fmt12(ev.time)}${ev.endTime ? ` – ${fmt12(ev.endTime)}` : ''}` : 'Any time', ev.type, ev.location].filter(Boolean).join('  ·  ')}
        </Text>
      </View>
    </View>
  );
}

export default function ParentKidScreen({ navigation, route }: any) {
  const kidId: string = route?.params?.kidId;
  const [view, setView] = useState<'day' | 'week'>(route?.params?.view ?? 'day');
  const [day, setDay] = useState(new Date());
  const [photo, setPhoto] = useState<string | null>(null);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { kids, reloadKid, parentId } = useParentData();
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  const kid = kids.find((k) => k.id === kidId);
  if (!kid?.snap) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backWrap}><Text style={[styles.back, { fontFamily: theme.fMono, color: theme.accent }]}>← back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }
  const { homework, events, profile } = kid.snap;
  const school = profile?.school_name ?? undefined;
  const sod = startOfDay(new Date());
  const overdue = homework.filter((h) => !h.done && h.dueDate && new Date(h.dueDate) < sod);

  function shift(n: number) {
    const d = new Date(day); d.setDate(d.getDate() + (view === 'day' ? n : n * 7)); setDay(d);
  }

  async function refresh() { setRefreshing(true); await reloadKid(kidId); setRefreshing(false); }

  // ─── Day ───
  const renderDay = (d: Date) => {
    const dueHw = homework.filter((h) => h.dueDate && isSameDay(new Date(h.dueDate), d));
    const evs = events.filter((e) => e.date && isSameDay(new Date(e.date), d)).sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0));
    const closed = getClosedReason(d, school);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const sched = getDaySchedule(d, school);
    const classes = weekend || closed ? [] : classesOnDate(d, profile?.classes ?? [], profile?.timetable, school);
    return (
      <View style={styles.dayWrap}>
        {(closed || weekend) && (
          <Text style={[styles.note, { fontFamily: theme.fMono, color: theme.soft }]}>🏫 No school{closed ? ` · ${closed}` : ' · weekend'}</Text>
        )}
        {sched?.note && <Text style={[styles.note, { fontFamily: theme.fMono, color: theme.amber }]}>{sched.note}</Text>}

        {classes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { fontFamily: theme.fMono, color: theme.soft }]}>CLASSES</Text>
            <View style={[styles.classList, { backgroundColor: theme.surface }]}>
              {classes.map((c, i) => (
                <View key={i} style={[styles.classRow, { borderBottomColor: theme.line, borderBottomWidth: i < classes.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
                  <View style={[styles.classDot, { backgroundColor: c.cls.color }]} />
                  <Text style={[styles.className, { fontFamily: theme.fBody, color: theme.ink }]}>{c.cls.emoji} {c.cls.name}</Text>
                  <Text style={[styles.classTime, { fontFamily: theme.fMono, color: theme.soft }]}>{fmt12(c.start)}–{fmt12(c.end)}</Text>
                </View>
              ))}
              {sched && (
                <Text style={[styles.lunch, { fontFamily: theme.fMono, color: theme.soft }]}>
                  School {fmt12(sched.dayStart)}–{fmt12(sched.dayEnd)}{sched.periods.find((p) => p.kind === 'lunch') ? ` · Lunch ${fmt12(sched.periods.find((p) => p.kind === 'lunch')!.start)}` : ''}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { fontFamily: theme.fMono, color: theme.soft }]}>HOMEWORK DUE · {dueHw.filter((h) => h.done).length}/{dueHw.length} DONE</Text>
          {dueHw.length === 0
            ? <Text style={[styles.empty, { fontFamily: theme.fBody, color: theme.soft }]}>Nothing due this day.</Text>
            : dueHw.map((h) => <HomeworkCard key={h.id} hw={h} theme={theme} onPhoto={setPhoto} />)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { fontFamily: theme.fMono, color: theme.soft }]}>PLANS & ACTIVITIES</Text>
          {evs.length === 0
            ? <Text style={[styles.empty, { fontFamily: theme.fBody, color: theme.soft }]}>No sports, work or other plans entered.</Text>
            : evs.map((e) => <EventRow key={e.id} ev={e} theme={theme} />)}
        </View>
      </View>
    );
  };

  // ─── Week ───
  const monday = new Date(day); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); monday.setHours(12, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
  const weekHw = homework.filter((h) => h.dueDate && weekDays.some((d) => isSameDay(new Date(h.dueDate!), d)));

  const title = view === 'day'
    ? (isSameDay(day, new Date()) ? 'Today' : day.toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' }))
    : `${weekDays[0].toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={[styles.back, { fontFamily: theme.fMono, color: theme.accent }]}>← dashboard</Text></TouchableOpacity>
        <View style={styles.headRow}>
          <Text style={[styles.kidName, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{kid.name}.</Text>
          <TouchableOpacity style={[styles.nudgeBtn, { borderColor: theme.accent }]} onPress={() => setNudgeOpen(true)}>
            <Text style={[styles.nudgeText, { fontFamily: theme.fMono, color: theme.accent }]}>Nudge 👋</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          {(['day', 'week'] as const).map((v) => (
            <TouchableOpacity key={v} style={[styles.toggle, { backgroundColor: view === v ? theme.accent : theme.surface }]} onPress={() => setView(v)} accessibilityState={{ selected: view === v }}>
              <Text style={[styles.toggleText, { fontFamily: theme.fMono, color: view === v ? '#fff' : theme.sub }]}>{v === 'day' ? 'Day' : 'Week'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => shift(-1)} style={styles.navBtn} accessibilityLabel="Previous"><Text style={[styles.navArrow, { color: theme.accent }]}>‹</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setDay(new Date())}><Text style={[styles.navTitle, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>{title}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => shift(1)} style={styles.navBtn} accessibilityLabel="Next"><Text style={[styles.navArrow, { color: theme.accent }]}>›</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />}>
        {overdue.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { fontFamily: theme.fMono, color: theme.red }]}>⚠ OVERDUE · {overdue.length}</Text>
            {overdue.map((h) => <HomeworkCard key={h.id} hw={h} theme={theme} onPhoto={setPhoto} />)}
          </View>
        )}

        {view === 'day' ? renderDay(day) : (
          <>
            <Text style={[styles.weekSummary, { fontFamily: theme.fMono, color: theme.sub }]}>
              {weekHw.filter((h) => h.done).length} of {weekHw.length} assignments due this week are done
            </Text>
            {weekDays.map((d) => {
              const hw = homework.filter((h) => h.dueDate && isSameDay(new Date(h.dueDate), d));
              const evs = events.filter((e) => e.date && isSameDay(new Date(e.date), d)).sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0));
              const closed = getClosedReason(d, school);
              const isToday = isSameDay(d, new Date());
              return (
                <TouchableOpacity key={d.toISOString()} activeOpacity={0.8} onPress={() => { setDay(d); setView('day'); }} style={[styles.weekDay, { borderColor: isToday ? theme.accent : theme.line }]}>
                  <View style={styles.weekDayHead}>
                    <Text style={[styles.weekDayName, { fontFamily: theme.fBodySemiBold, color: isToday ? theme.accent : theme.ink }]}>
                      {d.toLocaleDateString('en-CA', { weekday: 'long' })} <Text style={{ color: theme.soft, fontFamily: theme.fMono, fontSize: 12 }}>{d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</Text>
                    </Text>
                    {closed && <Text style={[styles.closedTag, { fontFamily: theme.fMono, color: theme.amber }]}>{closed}</Text>}
                  </View>
                  {hw.length === 0 && evs.length === 0 && <Text style={[styles.empty, { fontFamily: theme.fBody, color: theme.soft }]}>Nothing entered</Text>}
                  {hw.map((h) => {
                    const st = status(h);
                    const c = st.tone === 'done' ? theme.mint : st.tone === 'overdue' ? theme.red : theme.ink;
                    return (
                      <Text key={h.id} style={[styles.weekLine, { fontFamily: theme.fBody, color: c }]}>
                        {h.done ? '✓' : st.tone === 'overdue' ? '⚠' : '○'} {h.title}<Text style={{ color: theme.soft }}>{h.subject ? `  ·  ${h.subject}` : ''}</Text>
                      </Text>
                    );
                  })}
                  {evs.map((e) => (
                    <Text key={e.id} style={[styles.weekLine, { fontFamily: theme.fBody, color: theme.sub }]}>
                      {e.icon ?? eventIcon(e.type)} {e.title}{e.time ? `  ·  ${fmt12(e.time)}` : ''}
                    </Text>
                  ))}
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <Modal visible={!!photo} transparent animationType="fade" onRequestClose={() => setPhoto(null)}>
        <TouchableOpacity style={styles.photoBackdrop} activeOpacity={1} onPress={() => setPhoto(null)}>
          {photo && <Image source={{ uri: photo }} style={styles.photoFull} resizeMode="contain" />}
        </TouchableOpacity>
      </Modal>
      <NudgeSheet visible={nudgeOpen} onClose={() => setNudgeOpen(false)} parentId={parentId} kidId={kid.id} kidName={kid.name} kidPushToken={profile?.push_token} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backWrap: { padding: 20 },
  header: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  back: { fontSize: 13, letterSpacing: 0.5 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kidName: { fontSize: 34 },
  nudgeBtn: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  nudgeText: { fontSize: 12 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggle: { borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8 },
  toggleText: { fontSize: 12, letterSpacing: 0.5 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { paddingHorizontal: 12, paddingVertical: 4 },
  navArrow: { fontSize: 26 },
  navTitle: { fontSize: 16 },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  dayWrap: { gap: 14 },
  note: { fontSize: 12, letterSpacing: 0.3 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.2 },
  empty: { fontSize: 14 },
  classList: { borderRadius: 18, paddingVertical: 4 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  classDot: { width: 8, height: 8, borderRadius: 4 },
  className: { flex: 1, fontSize: 15 },
  classTime: { fontSize: 11, fontVariant: ['tabular-nums'] },
  lunch: { fontSize: 10, letterSpacing: 0.3, paddingHorizontal: 14, paddingVertical: 8 },
  hwCard: { borderLeftWidth: 4, borderRadius: 16, padding: 14, gap: 6 },
  hwTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  hwTitle: { flex: 1, fontSize: 15, lineHeight: 20 },
  statusPill: { fontSize: 10, letterSpacing: 0.3, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  hwMeta: { fontSize: 11, letterSpacing: 0.2 },
  hwNotes: { fontSize: 14, lineHeight: 20 },
  photoRow: { flexDirection: 'row', gap: 8 },
  photo: { width: 72, height: 72, borderRadius: 12 },
  evRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12 },
  evIcon: { fontSize: 22 },
  evTitle: { fontSize: 15 },
  evMeta: { fontSize: 11, letterSpacing: 0.2, marginTop: 2 },
  weekSummary: { fontSize: 11, letterSpacing: 0.3 },
  weekDay: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 6 },
  weekDayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekDayName: { fontSize: 15 },
  closedTag: { fontSize: 10, letterSpacing: 0.5 },
  weekLine: { fontSize: 14, lineHeight: 20 },
  photoBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  photoFull: { width: '100%', height: '80%' },
});
