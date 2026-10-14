import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Image, Modal, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { quoteOfDay } from '../../data/quotes';
import { Class, Homework, CalEvent } from '../../types';
import { isSameDay, startOfDay, effectiveStreak, parseTime, fmt12, dateKey } from '../../lib/time';
import { getClosedReason, getDaySchedule } from '../../data/schoolCalendars';
import { eventIcon, tagIcon } from '../../data/constants';
import { classesOnDate, ScheduledClass } from '../../lib/timetable';
import DayPicker from '../../components/DayPicker';
import ShineCard from '../../components/ShineCard';
import FloatingParticles from '../../components/FloatingParticles';
import AddHomeworkSheet from '../sheets/AddHomeworkSheet';
import AddEventSheet from '../sheets/AddEventSheet';
import HomeworkDetailSheet from '../sheets/HomeworkDetailSheet';
import EventDetailSheet from '../sheets/EventDetailSheet';

type Theme = ReturnType<typeof makeTheme>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Which homework belongs on a class card for the selected day. */
function showsOnDay(hw: Homework, day: Date): boolean {
  const sod = startOfDay(day);
  const twoDays = new Date(sod); twoDays.setDate(sod.getDate() + 2);
  if (hw.done) {
    // Finished work only shows on the day it was due or the day it was finished
    return (!!hw.dueDate && isSameDay(new Date(hw.dueDate), day)) || (!!hw.doneAt && isSameDay(new Date(hw.doneAt), day));
  }
  // Open work: overdue, due that day, or due the day after
  return !!hw.dueDate && new Date(hw.dueDate) < twoDays;
}

function urgency(hw: Homework): { color: 'red' | 'amber' | null; label: string } {
  const sod = startOfDay(new Date());
  const tom = new Date(sod); tom.setDate(sod.getDate() + 1);
  const dat = new Date(sod); dat.setDate(sod.getDate() + 2);
  const due = hw.dueDate ? new Date(hw.dueDate) : null;
  if (!due) return { color: null, label: hw.due ?? '' };
  if (!hw.done && due < sod) return { color: 'red', label: 'Overdue' };
  if (due >= sod && due < tom) return { color: null, label: 'Due today' };
  if (!hw.done && due >= tom && due < dat) return { color: 'amber', label: 'Tomorrow' };
  return { color: null, label: due.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }) };
}

// ─── Small pieces ────────────────────────────────────────────────────────────

function PointsChip({ points, streak, theme }: { points: number; streak: number; theme: Theme }) {
  return (
    <LinearGradient colors={theme.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.pointsChip}>
      <Text style={[styles.pointsText, { fontFamily: theme.fMono }]}>🔥{streak}</Text>
      <Text style={[styles.pointsText, { fontFamily: theme.fMono, color: 'rgba(255,255,255,0.5)' }]}>·</Text>
      <Text style={[styles.pointsText, { fontFamily: theme.fMono }]}>{points.toLocaleString()} pts</Text>
    </LinearGradient>
  );
}

function QuoteCard({ theme, cardSurface }: { theme: Theme; cardSurface: string }) {
  const q = quoteOfDay(dateKey(new Date()));
  return (
    <ShineCard style={[styles.quoteCard, { backgroundColor: cardSurface }]}>
      <Text style={[styles.quoteFuel, { fontFamily: theme.fMono, color: theme.accent }]}>✦ DAILY FUEL</Text>
      <Text style={[styles.quoteText, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>"{q.t}"</Text>
      <Text style={[styles.quoteAuthor, { fontFamily: theme.fMono, color: theme.soft }]}>— {q.a}</Text>
    </ShineCard>
  );
}

function HwRow({ hw, theme, onToggle, onDetail }: { hw: Homework; theme: Theme; onToggle: () => void; onDetail: () => void }) {
  const color = hw.classColor ?? theme.accent;
  const u = urgency(hw);
  const urgentColor = u.color === 'red' ? theme.red : u.color === 'amber' ? theme.amber : null;
  return (
    <TouchableOpacity style={[styles.hwRow, hw.done && styles.hwRowDone]} onPress={onDetail} activeOpacity={0.7} accessibilityLabel={`${hw.title}, ${u.label}`}>
      <TouchableOpacity onPress={onToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="checkbox" accessibilityState={{ checked: hw.done }}>
        <View style={[styles.hwCheck, { borderColor: urgentColor ?? color, backgroundColor: hw.done ? color : 'transparent' }]}>
          {hw.done && <Text style={styles.hwCheckMark}>✓</Text>}
        </View>
      </TouchableOpacity>
      <View style={styles.hwInfo}>
        <Text style={[styles.hwTitle, {
          fontFamily: urgentColor ? theme.fBodyMedium : theme.fBody,
          color: hw.done ? theme.soft : urgentColor ?? theme.ink,
          textDecorationLine: hw.done ? 'line-through' : 'none',
        }]}>
          {u.color === 'red' ? '⚠ ' : ''}{hw.title}
        </Text>
        <View style={styles.hwMeta}>
          {hw.tag && (
            <View style={[styles.hwTag, { backgroundColor: color + '22' }]}>
              <Text style={[styles.hwTagText, { fontFamily: theme.fMono, color }]}>{tagIcon(hw.tag)} {hw.tag}</Text>
            </View>
          )}
          <Text style={[styles.hwDue, { fontFamily: theme.fMono, color: urgentColor ?? theme.soft }]}>
            {hw.done ? '✓ Done' : urgentColor ? `⬤ ${u.label}` : u.label}
          </Text>
        </View>
      </View>
      {(hw.attachedImages ?? []).length > 0 && (
        <Image source={{ uri: hw.attachedImages![0] }} style={[styles.hwThumb, { borderColor: color + '55' }]} />
      )}
    </TouchableOpacity>
  );
}

function ClassBlock({ cls, start, end, slotLabel, homework, isNow, theme, cardSurface, onAddHw, onToggleHw, onDetailHw }: {
  cls: Class; start: string; end: string; slotLabel: string; homework: Homework[]; isNow: boolean; theme: Theme; cardSurface: string;
  onAddHw: () => void; onToggleHw: (id: string) => void; onDetailHw: (hw: Homework) => void;
}) {
  return (
    <ShineCard style={[styles.classBlock, { backgroundColor: cardSurface, borderColor: isNow ? cls.color : theme.line, borderWidth: isNow ? 1.5 : 0 }]}>
      <View style={styles.classHeader}>
        <View style={[styles.classIcon, { backgroundColor: cls.color + '33' }]}>
          <Text style={styles.classEmoji}>{cls.emoji ?? '📚'}</Text>
        </View>
        <View style={styles.classInfo}>
          <Text style={[styles.className, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{cls.name}</Text>
          <Text style={[styles.classMeta, { fontFamily: theme.fMono, color: theme.soft }]}>
            {[`${fmt12(start)} – ${fmt12(end)}`, slotLabel, cls.teacher].filter(Boolean).join('  ·  ')}
          </Text>
        </View>
        {isNow && (
          <View style={[styles.nowBadge, { backgroundColor: cls.color }]}>
            <View style={styles.nowDot} />
            <Text style={[styles.nowText, { fontFamily: theme.fMono }]}>NOW</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.addHwBtn, { borderColor: cls.color + '88' }]} onPress={onAddHw} activeOpacity={0.7} accessibilityLabel={`Add homework for ${cls.name}`}>
          <Text style={{ color: cls.color, fontSize: 20, lineHeight: 24 }}>+</Text>
        </TouchableOpacity>
      </View>
      {homework.length > 0 && (
        <View style={[styles.hwList, { borderTopColor: theme.line }]}>
          {homework.map((hw) => (
            <HwRow key={hw.id} hw={hw} theme={theme} onToggle={() => onToggleHw(hw.id)} onDetail={() => onDetailHw(hw)} />
          ))}
        </View>
      )}
    </ShineCard>
  );
}

function EventBlock({ ev, theme, cardSurface, onPress }: { ev: CalEvent; theme: Theme; cardSurface: string; onPress: () => void }) {
  return (
    <ShineCard style={[styles.eventBlock, { backgroundColor: cardSurface, borderLeftColor: theme.accent }]}>
      <TouchableOpacity style={styles.eventBlockInner} onPress={onPress} activeOpacity={0.8} accessibilityLabel={`${ev.title} at ${ev.time ?? ''}`}>
        <Text style={styles.eventEmoji}>{ev.icon ?? eventIcon(ev.type)}</Text>
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{ev.title}</Text>
          <Text style={[styles.eventLoc, { fontFamily: theme.fMono, color: theme.soft }]}>
            {[ev.time ? `${fmt12(ev.time)}${ev.endTime ? ` – ${fmt12(ev.endTime)}` : ''}` : '', ev.location].filter(Boolean).join('  ·  ')}
          </Text>
        </View>
        <Text style={[styles.chev, { color: theme.soft }]}>›</Text>
      </TouchableOpacity>
    </ShineCard>
  );
}

function Banner({ icon, title, sub, color, onPress, onDismiss, theme }: {
  icon: string; title: string; sub: string; color: string; onPress: () => void; onDismiss: () => void; theme: Theme;
}) {
  const slideY = useRef(new Animated.Value(-40)).current;
  useEffect(() => {
    Animated.spring(slideY, { toValue: 0, useNativeDriver: false, tension: 80, friction: 10 }).start();
  }, []);
  return (
    <Animated.View style={[styles.banner, { backgroundColor: color, transform: [{ translateY: slideY }] }]}>
      <TouchableOpacity style={styles.bannerContent} onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityHint="Opens it">
        <Text style={styles.bannerIcon}>{icon}</Text>
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { fontFamily: theme.fMono }]}>{title}</Text>
          <Text style={[styles.bannerSub, { fontFamily: theme.fBody }]} numberOfLines={2}>{sub}</Text>
        </View>
        <Text style={[styles.bannerOpen, { fontFamily: theme.fMono }]}>Open ›</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDismiss} style={styles.bannerClose} accessibilityLabel="Dismiss">
        <Text style={styles.bannerCloseText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hwSheetClass, setHwSheetClass] = useState<Class | null>(null);
  const [hwSheetOpen, setHwSheetOpen] = useState(false);
  const [hwEdit, setHwEdit] = useState<Homework | null>(null);
  const [evSheetOpen, setEvSheetOpen] = useState(false);
  const [evEdit, setEvEdit] = useState<CalEvent | null>(null);
  const [hwDetailId, setHwDetailId] = useState<string | null>(null);
  const [evDetailId, setEvDetailId] = useState<string | null>(null);
  const [dueListOpen, setDueListOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const fabRotate = useRef(new Animated.Value(0)).current;
  const [dueBannerDismissed, setDueBannerDismissed] = useState(false);

  const homework = useStore((s) => s.homework);
  const events = useStore((s) => s.events);
  const classes = useStore((s) => s.classes);
  const timetable = useStore((s) => s.timetable);
  const school = useStore((s) => s.school);
  const points = useStore((s) => s.points);
  const streak = useStore((s) => s.streak);
  const lastActivityDate = useStore((s) => s.lastActivityDate);
  const toggleHomework = useStore((s) => s.toggleHomework);
  const nudges = useStore((s) => s.nudges);
  const pushNudge = useStore((s) => s.pushNudge);
  const dismissNudge = useStore((s) => s.dismissNudge);
  const checkNudges = useStore((s) => s.checkNudges);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const userId = useStore((s) => s.userId);
  const bgImageUri = useStore((s) => s.bgImageUri);
  const theme = makeTheme(vibe, darkMode);

  // Nudges from a parent: anything unseen on open, plus live while the app is open
  useEffect(() => {
    if (!userId) return;
    checkNudges();
    const channel = supabase
      .channel(`nudges:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nudges', filter: `student_id=eq.${userId}` },
        (payload: any) => {
          const n = payload.new;
          if (!n.seen) pushNudge({ id: n.id, message: n.message, sentAt: n.sent_at });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isToday = isSameDay(selectedDate, now);

  const dueToday = homework.filter((h) => !h.done && h.dueDate && isSameDay(new Date(h.dueDate), now));
  const overdue = homework.filter((h) => !h.done && h.dueDate && new Date(h.dueDate) < startOfDay(now));
  const alertItems = [...overdue, ...dueToday];

  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const closedReason = getClosedReason(selectedDate, school.name);
  const showClasses = !isWeekend && !closedReason;
  const schedule = getDaySchedule(selectedDate, school.name);

  const scheduled: ScheduledClass[] = showClasses ? classesOnDate(selectedDate, classes, timetable, school.name) : [];
  const classIds = new Set(classes.map((c) => c.id));
  const shownIds = new Set<string>();
  const classHw = (id: string) => homework.filter((h) => h.classId === id && showsOnDay(h, selectedDate));
  // A class that meets twice in a day shows its homework once
  const seenClass = new Set<string>();
  const blocks = scheduled.map((sc) => {
    const hw = seenClass.has(sc.cls.id) ? [] : classHw(sc.cls.id);
    seenClass.add(sc.cls.id);
    hw.forEach((h) => shownIds.add(h.id));
    return { ...sc, hw };
  });
  const otherHw = homework.filter((h) => (!h.classId || !classIds.has(h.classId)) && showsOnDay(h, selectedDate));
  otherHw.forEach((h) => shownIds.add(h.id));

  const todayEvents = events
    .filter((e) => e.date && isSameDay(new Date(e.date), selectedDate))
    .sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0));

  // Coming up: open work not already on a card — overdue, or due within the next week
  const weekOut = new Date(startOfDay(selectedDate)); weekOut.setDate(weekOut.getDate() + 8);
  const upcomingHw = homework
    .filter((h) => !h.done && h.dueDate && !shownIds.has(h.id) && new Date(h.dueDate) < weekOut)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  function isNow(start: string, end: string) {
    const s = parseTime(start); const e = parseTime(end);
    return isToday && s !== null && e !== null && nowMin >= s && nowMin < e;
  }

  const hasBg = bgImageUri !== '';
  const cardSurface = hasBg ? 'rgba(20,20,20,0.78)' : theme.surface;
  const hwDetail = homework.find((h) => h.id === hwDetailId) ?? null;
  const evDetail = events.find((e) => e.id === evDetailId) ?? null;
  const shownStreak = effectiveStreak(streak, lastActivityDate);

  function openAlert() {
    setDueBannerDismissed(true);
    if (alertItems.length === 1) setHwDetailId(alertItems[0].id);
    else setDueListOpen(true);
  }

  const lunch = schedule?.periods.find((p) => p.kind === 'lunch');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {!hasBg && (
        <LinearGradient colors={[theme.accent + '38', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.65 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      )}
      <FloatingParticles color={theme.accent} />
      {hasBg && (
        <ImageBackground source={{ uri: bgImageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover">
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />
        </ImageBackground>
      )}

      {nudges.length > 0 ? (
        <Banner
          theme={theme}
          icon="👋"
          color={theme.accent}
          title="FROM YOUR PARENT"
          sub={nudges[0].message}
          onPress={() => { dismissNudge(nudges[0].id); if (alertItems.length) openAlert(); }}
          onDismiss={() => dismissNudge(nudges[0].id)}
        />
      ) : alertItems.length > 0 && !dueBannerDismissed ? (
        <Banner
          theme={theme}
          icon={overdue.length ? '⚠️' : '🔔'}
          color={overdue.length ? theme.red : theme.accent}
          title={overdue.length ? `${overdue.length} OVERDUE${dueToday.length ? ` · ${dueToday.length} DUE TODAY` : ''}` : 'DUE TODAY'}
          sub={alertItems.length === 1 ? alertItems[0].title : alertItems.map((h) => h.title).join(' · ')}
          onPress={openAlert}
          onDismiss={() => setDueBannerDismissed(true)}
        />
      ) : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={[styles.screenTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{isToday ? 'today' : selectedDate.toLocaleDateString('en-CA', { weekday: 'long' }).toLowerCase()}</Text>
          <PointsChip points={points} streak={shownStreak} theme={theme} />
        </View>

        <View style={styles.dayPickerWrap}>
          <DayPicker selected={selectedDate} onSelect={setSelectedDate} />
        </View>

        {schedule && (
          <View style={[styles.bellStrip, { borderColor: theme.line }]}>
            <Text style={[styles.bellText, { fontFamily: theme.fMono, color: theme.sub }]}>
              🔔 School {fmt12(schedule.dayStart)} – {fmt12(schedule.dayEnd)}{lunch ? `  ·  Lunch ${fmt12(lunch.start)}` : ''}
            </Text>
            {schedule.note && <Text style={[styles.bellNote, { fontFamily: theme.fMono, color: theme.amber }]}>{schedule.note}</Text>}
          </View>
        )}

        {isToday && <QuoteCard theme={theme} cardSurface={cardSurface} />}

        {(isWeekend || closedReason) && (
          <ShineCard style={[styles.noSchoolBanner, { backgroundColor: cardSurface }]}>
            <Text style={styles.noSchoolIcon}>{closedReason ? '🏫' : '🛋️'}</Text>
            <Text style={[styles.noSchoolText, { fontFamily: theme.fDisplayItalic, color: theme.sub }]}>{closedReason ?? 'Weekend'}</Text>
            <Text style={[styles.noSchoolSub, { fontFamily: theme.fMono, color: theme.soft }]}>No school</Text>
          </ShineCard>
        )}

        {blocks.map((b, i) => (
          <ClassBlock
            key={`${b.cls.id}-${i}`}
            cls={b.cls}
            start={b.start}
            end={b.end}
            slotLabel={b.slotLabel}
            homework={b.hw}
            isNow={isNow(b.start, b.end)}
            theme={theme}
            cardSurface={cardSurface}
            onAddHw={() => setHwSheetClass(b.cls)}
            onToggleHw={toggleHomework}
            onDetailHw={(hw) => setHwDetailId(hw.id)}
          />
        ))}

        {otherHw.length > 0 && (
          <ShineCard style={[styles.classBlock, { backgroundColor: cardSurface }]}>
            <View style={styles.classHeader}>
              <View style={[styles.classIcon, { backgroundColor: theme.accent + '22' }]}><Text style={styles.classEmoji}>🗂️</Text></View>
              <View style={styles.classInfo}>
                <Text style={[styles.className, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Other homework</Text>
                <Text style={[styles.classMeta, { fontFamily: theme.fMono, color: theme.soft }]}>Not tied to a class</Text>
              </View>
            </View>
            <View style={[styles.hwList, { borderTopColor: theme.line }]}>
              {otherHw.map((hw) => (
                <HwRow key={hw.id} hw={hw} theme={theme} onToggle={() => toggleHomework(hw.id)} onDetail={() => setHwDetailId(hw.id)} />
              ))}
            </View>
          </ShineCard>
        )}

        {todayEvents.length > 0 && (
          <Text style={[styles.sectionLabel, { fontFamily: theme.fMono, color: theme.soft }]}>{isToday ? 'AFTER SCHOOL & PLANS' : 'PLANS'}</Text>
        )}
        {todayEvents.map((ev) => (
          <EventBlock key={ev.id} ev={ev} theme={theme} cardSurface={cardSurface} onPress={() => setEvDetailId(ev.id)} />
        ))}

        {upcomingHw.length > 0 && (
          <View style={[styles.upcomingSection, { borderTopColor: theme.line }]}>
            <Text style={[styles.sectionLabel, { fontFamily: theme.fMono, color: theme.soft }]}>COMING UP</Text>
            {upcomingHw.map((hw) => {
              const u = urgency(hw);
              const c = u.color === 'red' ? theme.red : u.color === 'amber' ? theme.amber : theme.soft;
              return (
                <TouchableOpacity key={hw.id} onPress={() => setHwDetailId(hw.id)} activeOpacity={0.8}>
                  <ShineCard style={[styles.upcomingItem, { backgroundColor: cardSurface, borderLeftColor: u.color ? c : hw.classColor ?? theme.line }]}>
                    <View style={styles.upcomingItemTop}>
                      <Text style={[styles.upcomingTitle, { fontFamily: u.color ? theme.fBodyMedium : theme.fBody, color: u.color ? c : theme.ink }]} numberOfLines={1}>{hw.title}</Text>
                      <Text style={[styles.upcomingDue, { fontFamily: theme.fMono, color: c, backgroundColor: c + '20' }]}>{u.label}</Text>
                    </View>
                    {hw.subject && <Text style={[styles.upcomingSub, { fontFamily: theme.fMono, color: theme.soft }]}>{hw.subject}</Text>}
                  </ShineCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {showClasses && blocks.length === 0 && otherHw.length === 0 && todayEvents.length === 0 && upcomingHw.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { fontFamily: theme.fDisplayItalic, color: theme.sub }]}>Nothing due. Enjoy the day.</Text>
          </View>
        )}
      </ScrollView>

      {fabOpen && <TouchableOpacity style={styles.fabBackdrop} onPress={() => setFabOpen(false)} activeOpacity={1} />}
      <View style={styles.fabArea}>
        {fabOpen && (
          <View style={styles.fabMenu}>
            <TouchableOpacity style={[styles.fabMenuItem, { backgroundColor: theme.surface, borderColor: theme.line }]} onPress={() => { setFabOpen(false); setHwSheetOpen(true); }}>
              <Text style={styles.fabMenuIcon}>📚</Text>
              <Text style={[styles.fabMenuLabel, { fontFamily: theme.fMono, color: theme.ink }]}>Homework</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fabMenuItem, { backgroundColor: theme.surface, borderColor: theme.line }]} onPress={() => { setFabOpen(false); setEvSheetOpen(true); }}>
              <Text style={styles.fabMenuIcon}>📅</Text>
              <Text style={[styles.fabMenuLabel, { fontFamily: theme.fMono, color: theme.ink }]}>Event / plan</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.accent }]}
          onPress={() => {
            Animated.spring(fabRotate, { toValue: fabOpen ? 0 : 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
            setFabOpen((v) => !v);
          }}
          activeOpacity={0.85}
          accessibilityLabel="Add homework or an event"
        >
          <Animated.Text style={[styles.fabIcon, { transform: [{ rotate: fabRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }]}>+</Animated.Text>
        </TouchableOpacity>
      </View>

      {/* Due / overdue list (banner shortcut when there are several) */}
      <Modal visible={dueListOpen} transparent animationType="fade" onRequestClose={() => setDueListOpen(false)}>
        <TouchableOpacity style={styles.listBackdrop} activeOpacity={1} onPress={() => setDueListOpen(false)}>
          <View style={[styles.listCard, { backgroundColor: theme.bg }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.listTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Needs doing</Text>
            {alertItems.map((hw) => {
              const u = urgency(hw);
              return (
                <TouchableOpacity key={hw.id} style={[styles.listRow, { borderBottomColor: theme.line }]} onPress={() => { setDueListOpen(false); setHwDetailId(hw.id); }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listRowTitle, { fontFamily: theme.fBodyMedium, color: u.color === 'red' ? theme.red : theme.ink }]}>{hw.title}</Text>
                    <Text style={[styles.listRowSub, { fontFamily: theme.fMono, color: theme.soft }]}>{[hw.subject, u.label].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <Text style={[styles.chev, { color: theme.soft }]}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <AddHomeworkSheet
        visible={!!hwSheetClass || hwSheetOpen || !!hwEdit}
        onClose={() => { setHwSheetClass(null); setHwSheetOpen(false); setHwEdit(null); }}
        defaultDate={selectedDate}
        defaultClass={hwSheetClass}
        editHw={hwEdit}
      />
      <AddEventSheet
        visible={evSheetOpen || !!evEdit}
        onClose={() => { setEvSheetOpen(false); setEvEdit(null); }}
        defaultDate={selectedDate}
        editEvent={evEdit}
      />
      <HomeworkDetailSheet
        hw={hwDetail}
        visible={!!hwDetail}
        onClose={() => setHwDetailId(null)}
        onEdit={(hw) => setHwEdit(hw)}
      />
      <EventDetailSheet
        ev={evDetail}
        visible={!!evDetail}
        onClose={() => setEvDetailId(null)}
        onEdit={(ev) => setEvEdit(ev)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 110 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  screenTitle: { fontSize: 52, lineHeight: 58 },
  pointsChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  pointsText: { color: '#fff', fontSize: 14 },
  dayPickerWrap: { marginHorizontal: -16, marginBottom: 8 },
  bellStrip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, gap: 2 },
  bellText: { fontSize: 11, letterSpacing: 0.3 },
  bellNote: { fontSize: 11, letterSpacing: 0.3 },
  quoteCard: { borderRadius: 28, padding: 20, gap: 8, marginBottom: 14 },
  quoteFuel: { fontSize: 10, letterSpacing: 1.5 },
  quoteText: { fontSize: 19, lineHeight: 28 },
  quoteAuthor: { fontSize: 12, letterSpacing: 0.3 },
  classBlock: { borderRadius: 28, overflow: 'hidden', marginBottom: 14 },
  classHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  classIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  classEmoji: { fontSize: 22 },
  classInfo: { flex: 1 },
  className: { fontSize: 20, lineHeight: 25 },
  classMeta: { fontSize: 11, letterSpacing: 0.3, marginTop: 3 },
  nowBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  nowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  nowText: { color: '#fff', fontSize: 10, letterSpacing: 1 },
  addHwBtn: { width: 32, height: 32, borderRadius: 26, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  hwList: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingBottom: 8 },
  hwRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 10 },
  hwRowDone: { opacity: 0.55 },
  hwCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  hwCheckMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  hwInfo: { flex: 1, gap: 4 },
  hwTitle: { fontSize: 15, lineHeight: 20 },
  hwMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  hwTag: { borderRadius: 32, paddingHorizontal: 7, paddingVertical: 3 },
  hwTagText: { fontSize: 10, letterSpacing: 0.3 },
  hwDue: { fontSize: 11, letterSpacing: 0.3 },
  hwThumb: { width: 44, height: 44, borderRadius: 10, borderWidth: 1 },
  eventBlock: { borderRadius: 24, borderLeftWidth: 4, marginBottom: 10 },
  eventBlockInner: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventEmoji: { fontSize: 20 },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15 },
  eventLoc: { fontSize: 11, letterSpacing: 0.3 },
  chev: { fontSize: 22 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.2, marginTop: 6, marginBottom: 8 },
  noSchoolBanner: { borderRadius: 26, padding: 24, alignItems: 'center', gap: 6, marginBottom: 12 },
  noSchoolIcon: { fontSize: 36 },
  noSchoolText: { fontSize: 22 },
  noSchoolSub: { fontSize: 10, letterSpacing: 1 },
  upcomingSection: { marginTop: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  upcomingItem: { borderLeftWidth: 3, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  upcomingItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  upcomingTitle: { fontSize: 14, flex: 1 },
  upcomingDue: { fontSize: 10, letterSpacing: 0.3, borderRadius: 32, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  upcomingSub: { fontSize: 11, letterSpacing: 0.3 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 22, textAlign: 'center' },
  fabBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  fabArea: { position: 'absolute', bottom: 24, right: 20, alignItems: 'flex-end', zIndex: 20 },
  fabMenu: { gap: 8, marginBottom: 12, alignItems: 'flex-end' },
  fabMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 34, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 11 },
  fabMenuIcon: { fontSize: 16 },
  fabMenuLabel: { fontSize: 13, letterSpacing: 0.3 },
  fab: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32, marginTop: -2 },
  banner: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 4, marginBottom: 2, zIndex: 100,
    borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 12,
  },
  bannerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  bannerIcon: { fontSize: 22 },
  bannerText: { flex: 1 },
  bannerTitle: { color: '#fff', fontSize: 11, letterSpacing: 1, opacity: 0.9 },
  bannerSub: { color: '#fff', fontSize: 14, marginTop: 1 },
  bannerOpen: { color: '#fff', fontSize: 12, letterSpacing: 0.5 },
  bannerClose: { paddingHorizontal: 14, paddingVertical: 10 },
  bannerCloseText: { color: '#fff', fontSize: 24, lineHeight: 28, opacity: 0.8 },
  listBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  listCard: { borderRadius: 24, padding: 18, gap: 4, maxWidth: 520, width: '100%', alignSelf: 'center' },
  listTitle: { fontSize: 26, marginBottom: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  listRowTitle: { fontSize: 15 },
  listRowSub: { fontSize: 11, letterSpacing: 0.3, marginTop: 2 },
});
