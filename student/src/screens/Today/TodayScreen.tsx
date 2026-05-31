import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Modal,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { quoteOfDay } from '../../data/quotes';
import { POSITIVE_NEWS } from '../../data/news';
import { fetchGoodNews, NewsItem } from '../../lib/goodNews';
import { Class, Homework, CalEvent } from '../../types';
import DayPicker from '../../components/DayPicker';
import ShineCard from '../../components/ShineCard';
import FloatingParticles from '../../components/FloatingParticles';
import AddHomeworkSheet from '../sheets/AddHomeworkSheet';
import AddEventSheet from '../sheets/AddEventSheet';
import HomeworkDetailSheet from '../sheets/HomeworkDetailSheet';
import { getClosedReason } from '../../data/schoolClosed';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function PointsChip({ points, streak, theme }: any) {
  return (
    <LinearGradient
      colors={theme.accentGrad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.pointsChip}
    >
      <Text style={[styles.pointsStreak, { fontFamily: theme.fMono }]}>🔥{streak}</Text>
      <Text style={[styles.pointsDot, { fontFamily: theme.fMono, color: 'rgba(255,255,255,0.5)' }]}>·</Text>
      <Text style={[styles.pointsNum, { fontFamily: theme.fMono }]}>{points.toLocaleString()} pts</Text>
    </LinearGradient>
  );
}

function NewsTicker({ theme }: any) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const [news, setNews] = useState<NewsItem[]>(POSITIVE_NEWS);
  const [live, setLive] = useState(false);

  useEffect(() => {
    fetchGoodNews().then((items) => {
      setNews(items);
      setLive(true);
    }).catch(() => {});
  }, []);

  const doubled = [...news, ...news];
  const totalWidth = news.reduce((a, n) => a + n.text.length * 7.2 + 48, 0);

  useEffect(() => {
    scrollX.setValue(0);
    animRef.current?.stop();
    const loop = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -totalWidth,
        duration: totalWidth * 10,
        useNativeDriver: false,
      })
    );
    animRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [news]);

  return (
    <View style={[styles.tickerContainer, { backgroundColor: theme.surface, borderBottomColor: theme.line }]}>
      <View style={styles.tickerLabelRow}>
        <View style={[styles.tickerDot, { backgroundColor: live ? theme.mint : theme.soft }]} />
        <Text style={[styles.tickerLabel, { fontFamily: theme.fMono, color: live ? theme.mint : theme.soft }]}>
          {live ? 'GOOD THINGS HAPPENING · LIVE' : 'GOOD THINGS HAPPENING'}
        </Text>
      </View>
      <View style={styles.tickerWrap}>
        <Animated.View style={[styles.tickerScroll, { transform: [{ translateX: scrollX }] }]}>
          {doubled.map((n, i) => (
            <View key={i} style={styles.tickerItemWrap}>
              <Text style={[styles.tickerSrc, { fontFamily: theme.fMono, color: theme.accent }]}>{n.src}</Text>
              <Text style={[styles.tickerText, { fontFamily: theme.fMono, color: theme.sub }]}>{'  '}{n.text}{'   ·   '}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

function QuoteCard({ theme, cardSurface }: any) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const q = quoteOfDay(dateStr);
  return (
    <ShineCard style={[styles.quoteCard, { backgroundColor: cardSurface ?? theme.surface }]}>
      <Text style={[styles.quoteFuel, { fontFamily: theme.fMono, color: theme.accent }]}>✦ DAILY FUEL</Text>
      <Text style={[styles.quoteText, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>"{q.t}"</Text>
      <Text style={[styles.quoteAuthor, { fontFamily: theme.fMono, color: theme.soft }]}>— {q.a}</Text>
    </ShineCard>
  );
}

function ImagePreviewModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.imgModalBackdrop} activeOpacity={1} onPress={onClose}>
        <Image source={{ uri }} style={styles.imgModalFull} resizeMode="contain" />
        <TouchableOpacity style={styles.imgModalClose} onPress={onClose}>
          <Text style={styles.imgModalCloseText}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function HwRow({ hw, theme, onToggle, onDetail }: { hw: Homework; theme: any; onToggle: () => void; onDetail: () => void }) {
  const color = hw.classColor ?? theme.accent;
  return (
    <TouchableOpacity style={[styles.hwRow, hw.done && styles.hwRowDone]} onPress={onDetail} activeOpacity={0.7}>
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <View style={[styles.hwCheck, { borderColor: color, backgroundColor: hw.done ? color : 'transparent' }]}>
          {hw.done && <Text style={styles.hwCheckMark}>✓</Text>}
        </View>
      </TouchableOpacity>
      <View style={styles.hwInfo}>
        <Text style={[styles.hwTitle, { fontFamily: hw.dueUrgent && !hw.done ? theme.fBodyMedium : theme.fBody, color: hw.done ? theme.soft : hw.dueUrgent ? theme.red : theme.ink }, hw.done && { textDecorationLine: 'line-through' }]}>
          {hw.title}
        </Text>
        <View style={styles.hwMeta}>
          {hw.tag && (
            <View style={[styles.hwTag, { backgroundColor: color + '22' }]}>
              <Text style={[styles.hwTagText, { fontFamily: theme.fMono, color }]}>
                {hw.tag === 'Reading' ? '📖' : hw.tag === 'Quiz' ? '✦' : hw.tag === 'Worksheet' ? '📋' : hw.tag === 'Lab' ? '🧪' : '•'} {hw.tag}
              </Text>
            </View>
          )}
          {hw.due && (
            <Text style={[styles.hwDue, { fontFamily: theme.fMono, color: hw.dueUrgent ? theme.amber : theme.soft }]}>
              {hw.dueUrgent && '△ '}{hw.due}
            </Text>
          )}
        </View>
      </View>
      {(hw.attachedImages ?? []).length > 0 && (
        <View style={styles.hwThumbs}>
          {(hw.attachedImages ?? []).map((uri, i) => (
            <Image key={i} source={{ uri }} style={[styles.hwThumb, { borderColor: color + '55' }]} resizeMode="cover" />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

function ClassBlock({ cls, homework, isNow, theme, cardSurface, onAddHw, onToggleHw, onDetailHw }: {
  cls: Class; homework: Homework[]; isNow: boolean;
  theme: any; cardSurface?: string; onAddHw: () => void; onToggleHw: (id: string) => void; onDetailHw: (hw: Homework) => void;
}) {
  return (
    <ShineCard style={[styles.classBlock, { backgroundColor: cardSurface ?? theme.surface, borderColor: isNow ? cls.color : theme.line, borderWidth: isNow ? 1.5 : 0 }]}>
      <View style={styles.classHeader}>
        <View style={[styles.classIcon, { backgroundColor: cls.color + '33' }]}>
          <Text style={styles.classEmoji}>{cls.emoji ?? '📚'}</Text>
        </View>
        <View style={styles.classInfo}>
          <Text style={[styles.className, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{cls.name}</Text>
          <Text style={[styles.classMeta, { fontFamily: theme.fMono, color: theme.soft }]}>
            {cls.start} – {cls.end}  ·  {cls.teacher}
          </Text>
        </View>
        {isNow && (
          <View style={[styles.nowBadge, { backgroundColor: cls.color }]}>
            <View style={styles.nowDot} />
            <Text style={[styles.nowText, { fontFamily: theme.fMono }]}>NOW</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.addHwBtn, { borderColor: cls.color + '88' }]} onPress={onAddHw} activeOpacity={0.7}>
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

function DueReminderBanner({ count, titles, theme, onDismiss }: {
  count: number; titles: string[]; theme: any; onDismiss: () => void;
}) {
  const slideY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(slideY, { toValue: 0, useNativeDriver: false, tension: 80, friction: 10 }).start();
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, []);

  const label = count === 1 ? `"${titles[0]}"` : `${count} assignments`;

  return (
    <Animated.View
      style={[
        styles.reminderBanner,
        { backgroundColor: theme.accent, transform: [{ translateY: slideY }] },
      ]}
    >
      <View style={styles.reminderContent}>
        <Text style={[styles.reminderIcon]}>🔔</Text>
        <View style={styles.reminderText}>
          <Text style={[styles.reminderTitle, { fontFamily: theme.fMono }]}>Due today</Text>
          <Text style={[styles.reminderSub, { fontFamily: theme.fBody }]} numberOfLines={1}>{label}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.reminderClose}>
          <Text style={styles.reminderCloseText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function EventBlock({ ev, theme, cardSurface, onToggle }: { ev: CalEvent; theme: any; cardSurface?: string; onToggle: () => void }) {
  return (
    <ShineCard style={[styles.eventBlock, { backgroundColor: cardSurface ?? theme.surface, borderLeftColor: theme.accent }]}>
      <TouchableOpacity
        style={styles.eventBlockInner}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={[styles.eventTime, { fontFamily: theme.fMono, color: theme.accent }]}>{ev.time}</Text>
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{ev.title}</Text>
          {ev.location && (
            <Text style={[styles.eventLoc, { fontFamily: theme.fMono, color: theme.soft }]}>{ev.location}</Text>
          )}
        </View>
      </TouchableOpacity>
    </ShineCard>
  );
}

export default function TodayScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hwSheetClass, setHwSheetClass] = useState<Class | null>(null);
  const [hwSheetOpen, setHwSheetOpen] = useState(false);
  const [showEvSheet, setShowEvSheet] = useState(false);
  const [hwDetail, setHwDetail] = useState<Homework | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const fabRotate = useRef(new Animated.Value(0)).current;
  const [showReminder, setShowReminder] = useState(false);
  const [nudgeBanner, setNudgeBanner] = useState<string | null>(null);

  const homework = useStore((s) => s.homework);
  const events = useStore((s) => s.events);
  const classes = useStore((s) => s.classes);
  const points = useStore((s) => s.points);
  const streak = useStore((s) => s.streak);
  const toggleHomework = useStore((s) => s.toggleHomework);
  const toggleEvent = useStore((s) => s.toggleEvent);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const userId = useStore((s) => s.userId);
  const bgImageUri = useStore((s) => s.bgImageUri);
  const theme = makeTheme(vibe, darkMode);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`nudges:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nudges',
          filter: `student_id=eq.${userId}`,
        },
        (payload: any) => {
          const nudge = payload.new;
          if (nudge.seen) return;
          setNudgeBanner(nudge.message);
          setTimeout(() => {
            setNudgeBanner(null);
            supabase.from('nudges').update({ seen: true }).eq('id', nudge.id);
          }, 4000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const dueToday = homework.filter((h) => !h.done && h.dueDate && isSameDay(new Date(h.dueDate), now));

  useEffect(() => {
    if (dueToday.length > 0) {
      const t = setTimeout(() => setShowReminder(true), 800);
      return () => clearTimeout(t);
    }
  }, []);
  const isToday = isSameDay(selectedDate, new Date());

  const dayOfWeek = selectedDate.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const closedReason = getClosedReason(selectedDate);
  const showClasses = !isWeekend && !closedReason;

  function isClassNow(cls: Class) {
    if (!isToday || !cls.start || !cls.end) return false;
    return nowMin >= timeToMinutes(cls.start) && nowMin <= timeToMinutes(cls.end);
  }

  const todayEvents = events.filter((e) => e.date && isSameDay(new Date(e.date), selectedDate));

  const sevenDaysOut = new Date(selectedDate); sevenDaysOut.setDate(selectedDate.getDate() + 7);
  const startOfSelected = new Date(selectedDate); startOfSelected.setHours(23, 59, 59, 999);
  const upcomingHw = homework
    .filter((h) => {
      if (h.done || !h.dueDate) return false;
      const d = new Date(h.dueDate);
      return d > startOfSelected && d <= sevenDaysOut;
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const hasBg = bgImageUri !== '';
  const cardSurface = hasBg ? 'rgba(20,20,20,0.78)' : theme.surface;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
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
      {showReminder && (
        <DueReminderBanner
          count={dueToday.length}
          titles={dueToday.map((h) => h.title)}
          theme={theme}
          onDismiss={() => setShowReminder(false)}
        />
      )}
      {nudgeBanner !== null && (
        <View style={[styles.nudgeBanner, { backgroundColor: theme.accent }]}>
          <Text style={[styles.nudgeBannerText, { fontFamily: theme.fMono }]}>👋 {nudgeBanner}</Text>
        </View>
      )}
      {/* News ticker pinned at top */}
      <NewsTicker theme={theme} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: title + points chip */}
        <View style={styles.topBar}>
          <Text style={[styles.screenTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>today</Text>
          <PointsChip points={points} streak={streak} theme={theme} />
        </View>

        {/* Day picker */}
        <View style={styles.dayPickerWrap}>
          <DayPicker selected={selectedDate} onSelect={setSelectedDate} />
        </View>

        {/* Daily Fuel */}
        <QuoteCard theme={theme} cardSurface={cardSurface} />

        {/* No-school banner */}
        {(isWeekend || closedReason) && (
          <ShineCard style={[styles.noSchoolBanner, { backgroundColor: cardSurface }]}>
            <Text style={[styles.noSchoolIcon, { color: theme.soft }]}>
              {isWeekend ? '🛋️' : '🏫'}
            </Text>
            <Text style={[styles.noSchoolText, { fontFamily: theme.fDisplayItalic, color: theme.sub }]}>
              {isWeekend ? 'Weekend' : closedReason}
            </Text>
          </ShineCard>
        )}

        {/* Class blocks */}
        {showClasses && classes.map((cls) => {
          const classHw = homework.filter((h) => h.classId === cls.id);
          return (
            <ClassBlock
              key={cls.id}
              cls={cls}
              homework={classHw}
              isNow={isClassNow(cls)}
              theme={theme}
              cardSurface={cardSurface}
              onAddHw={() => setHwSheetClass(cls)}
              onToggleHw={toggleHomework}
              onDetailHw={setHwDetail}
            />
          );
        })}

        {/* Events */}
        {todayEvents.map((ev) => (
          <EventBlock key={ev.id} ev={ev} theme={theme} cardSurface={cardSurface} onToggle={() => toggleEvent(ev.id)} />
        ))}

        {/* Coming up this week */}
        {upcomingHw.length > 0 && (
          <View style={[styles.upcomingSection, { borderTopColor: theme.line }]}>
            <Text style={[styles.upcomingLabel, { fontFamily: theme.fMono, color: theme.soft }]}>COMING UP THIS WEEK</Text>
            {upcomingHw.map((hw) => {
              const color = hw.classColor ?? theme.accent;
              const due = new Date(hw.dueDate!);
              const tomorrow = new Date(selectedDate); tomorrow.setDate(selectedDate.getDate() + 1);
              const daysUntil = Math.ceil((due.getTime() - selectedDate.getTime()) / 86400000);
              const severityColor = isSameDay(due, tomorrow) ? theme.red : daysUntil <= 3 ? theme.amber : theme.soft;
              const dueLabel = isSameDay(due, tomorrow)
                ? 'Tomorrow'
                : due.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <ShineCard key={hw.id} style={[styles.upcomingItem, { backgroundColor: theme.surface, borderLeftColor: color }]}>
                  <View style={styles.upcomingItemTop}>
                    <Text style={[styles.upcomingTitle, { fontFamily: theme.fBody, color: theme.ink }]} numberOfLines={1}>{hw.title}</Text>
                    <Text style={[styles.upcomingDue, { fontFamily: theme.fMono, color: severityColor, backgroundColor: severityColor + '18' }]}>{dueLabel}</Text>
                  </View>
                  {hw.subject && <Text style={[styles.upcomingSub, { fontFamily: theme.fMono, color: theme.soft }]}>{hw.subject}</Text>}
                </ShineCard>
              );
            })}
          </View>
        )}

        {showClasses && classes.length === 0 && todayEvents.length === 0 && upcomingHw.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { fontFamily: theme.fDisplayItalic, color: theme.sub }]}>
              Nothing due. Enjoy the day.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating action button */}
      {fabOpen && (
        <TouchableOpacity style={styles.fabBackdrop} onPress={() => setFabOpen(false)} activeOpacity={1} />
      )}
      <View style={styles.fabArea}>
        {fabOpen && (
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: theme.surface, borderColor: theme.line }]}
              onPress={() => { setFabOpen(false); setHwSheetOpen(true); }}
            >
              <Text style={[styles.fabMenuIcon, { fontFamily: theme.fMono, color: theme.accent }]}>📚</Text>
              <Text style={[styles.fabMenuLabel, { fontFamily: theme.fMono, color: theme.ink }]}>Homework</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: theme.surface, borderColor: theme.line }]}
              onPress={() => { setFabOpen(false); setShowEvSheet(true); }}
            >
              <Text style={[styles.fabMenuIcon, { fontFamily: theme.fMono, color: theme.accent }]}>📅</Text>
              <Text style={[styles.fabMenuLabel, { fontFamily: theme.fMono, color: theme.ink }]}>Event / Task</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.accent }]}
          onPress={() => {
            const toVal = fabOpen ? 0 : 1;
            setFabOpen((v) => !v);
            Animated.spring(fabRotate, { toValue: toVal, useNativeDriver: true, tension: 120, friction: 8 }).start();
          }}
          activeOpacity={0.85}
        >
          <Animated.Text style={[styles.fabIcon, { transform: [{ rotate: fabRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }]}>+</Animated.Text>
        </TouchableOpacity>
      </View>

      <AddHomeworkSheet
        visible={!!hwSheetClass || hwSheetOpen}
        onClose={() => { setHwSheetClass(null); setHwSheetOpen(false); }}
        defaultDate={selectedDate}
        defaultClass={hwSheetClass}
      />
      <AddEventSheet visible={showEvSheet} onClose={() => setShowEvSheet(false)} defaultDate={selectedDate} />
      <HomeworkDetailSheet
        hw={hwDetail}
        visible={!!hwDetail}
        onClose={() => setHwDetail(null)}
        onToggle={() => hwDetail && toggleHomework(hwDetail.id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tickerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 6,
  },
  tickerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  tickerDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  tickerLabel: { fontSize: 9, letterSpacing: 1.5 },
  tickerWrap: { height: 18, overflow: 'hidden' },
  tickerScroll: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    top: 0,
    left: 0,
  },
  tickerItemWrap: { flexDirection: 'row' },
  tickerSrc: { fontSize: 11, letterSpacing: 0.3 },
  tickerText: { fontSize: 11, letterSpacing: 0.2, paddingHorizontal: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  screenTitle: { fontSize: 52, lineHeight: 58 },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  pointsStreak: { color: '#fff', fontSize: 14 },
  pointsDot: { fontSize: 14 },
  pointsNum: { color: '#fff', fontSize: 14 },
  dayPickerWrap: {
    marginHorizontal: -16,
    marginBottom: 12,
  },
  quoteCard: {
    borderRadius: 28,
    padding: 20,
    gap: 8,
    marginBottom: 14,
  },
  quoteFuel: { fontSize: 10, letterSpacing: 1.5 },
  quoteText: { fontSize: 19, lineHeight: 28 },
  quoteAuthor: { fontSize: 12, letterSpacing: 0.3 },
  classBlock: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 14,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  classIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classEmoji: { fontSize: 22 },
  classInfo: { flex: 1 },
  className: { fontSize: 20, lineHeight: 25 },
  classMeta: { fontSize: 11, letterSpacing: 0.3, marginTop: 3 },
  nowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  nowText: { color: '#fff', fontSize: 10, letterSpacing: 1 },
  addHwBtn: {
    width: 32,
    height: 32,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hwList: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingBottom: 8 },
  hwRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 10 },
  hwRowDone: { opacity: 0.5 },
  hwCheck: {
    width: 20,
    height: 20,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  hwCheckMark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hwInfo: { flex: 1, gap: 4 },
  hwTitle: { fontSize: 15, lineHeight: 20 },
  hwMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hwTag: { borderRadius: 32, paddingHorizontal: 7, paddingVertical: 3 },
  hwTagText: { fontSize: 10, letterSpacing: 0.3 },
  hwDue: { fontSize: 11, letterSpacing: 0.3 },
  hwThumbs: { flexDirection: 'column', gap: 4 },
  hwThumb: { width: 52, height: 52, borderRadius: 34, borderWidth: 1 },
  imgModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  imgModalFull: { width: '100%', height: '80%' },
  imgModalClose: { position: 'absolute', top: 50, right: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  imgModalCloseText: { color: '#fff', fontSize: 32, lineHeight: 36 },
  eventBlock: {
    borderRadius: 32,
    borderWidth: 0,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  eventBlockInner: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventTime: { fontSize: 13, letterSpacing: 0.5, minWidth: 52 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15 },
  eventLoc: { fontSize: 11, letterSpacing: 0.5, marginTop: 2 },
  noSchoolBanner: {
    borderRadius: 26,
    borderWidth: 0,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  noSchoolIcon: { fontSize: 36 },
  noSchoolText: { fontSize: 22 },
  upcomingSection: { marginTop: 8, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  upcomingLabel: { fontSize: 10, letterSpacing: 1.2, marginBottom: 2 },
  upcomingItem: { borderLeftWidth: 3, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  upcomingItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  upcomingTitle: { fontSize: 14, flex: 1 },
  upcomingDue: { fontSize: 10, letterSpacing: 0.3, borderRadius: 32, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  upcomingSub: { fontSize: 11, letterSpacing: 0.3 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 22, textAlign: 'center' },
  fabBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  fabArea: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  fabMenu: {
    gap: 8,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 34,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  fabMenuIcon: { fontSize: 16 },
  fabMenuLabel: { fontSize: 13, letterSpacing: 0.3 },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32, marginTop: -2 },
  nudgeBanner: {
    marginHorizontal: 20,
    marginBottom: 4,
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  nudgeBannerText: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  reminderBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  reminderContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  reminderIcon: { fontSize: 22 },
  reminderText: { flex: 1 },
  reminderTitle: { color: '#fff', fontSize: 11, letterSpacing: 1, opacity: 0.85 },
  reminderSub: { color: '#fff', fontSize: 14, marginTop: 1 },
  reminderClose: { padding: 4 },
  reminderCloseText: { color: '#fff', fontSize: 24, lineHeight: 28, opacity: 0.8 },
});
