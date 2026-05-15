import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { quoteOfDay } from '../../data/quotes';
import { POSITIVE_NEWS } from '../../data/news';
import { Class, Homework, CalEvent } from '../../types';
import DayPicker from '../../components/DayPicker';
import AddHomeworkSheet from '../sheets/AddHomeworkSheet';
import AddEventSheet from '../sheets/AddEventSheet';

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
  const totalWidth = POSITIVE_NEWS.reduce((a, n) => a + n.text.length * 7.2 + 48, 0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -totalWidth,
        duration: totalWidth * 10,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[styles.tickerContainer, { backgroundColor: theme.surface, borderBottomColor: theme.line }]}>
      <View style={styles.tickerLabelRow}>
        <View style={[styles.tickerDot, { backgroundColor: theme.mint }]} />
        <Text style={[styles.tickerLabel, { fontFamily: theme.fMono, color: theme.mint }]}>
          GOOD THINGS HAPPENING · LIVE
        </Text>
      </View>
      <View style={styles.tickerWrap}>
        <Animated.View style={[styles.tickerScroll, { transform: [{ translateX: scrollX }] }]}>
          {[...POSITIVE_NEWS, ...POSITIVE_NEWS].map((n, i) => (
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

function QuoteCard({ theme }: any) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const q = quoteOfDay(dateStr);
  return (
    <View style={[styles.quoteCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.quoteFuel, { fontFamily: theme.fMono, color: theme.accent }]}>✦ DAILY FUEL</Text>
      <Text style={[styles.quoteText, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>"{q.t}"</Text>
      <Text style={[styles.quoteAuthor, { fontFamily: theme.fMono, color: theme.soft }]}>— {q.a}</Text>
    </View>
  );
}

function HwRow({ hw, theme, onToggle }: { hw: Homework; theme: any; onToggle: () => void }) {
  const color = hw.classColor ?? theme.accent;
  return (
    <TouchableOpacity style={[styles.hwRow, hw.done && styles.hwRowDone]} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.hwCheck, { borderColor: color, backgroundColor: hw.done ? color : 'transparent' }]}>
        {hw.done && <Text style={styles.hwCheckMark}>✓</Text>}
      </View>
      <View style={styles.hwInfo}>
        <Text style={[styles.hwTitle, { fontFamily: theme.fBody, color: hw.done ? theme.soft : theme.ink }, hw.done && { textDecorationLine: 'line-through' }]}>
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
    </TouchableOpacity>
  );
}

function ClassBlock({ cls, homework, isNow, theme, onAddHw, onToggleHw }: {
  cls: Class; homework: Homework[]; isNow: boolean;
  theme: any; onAddHw: () => void; onToggleHw: (id: string) => void;
}) {
  return (
    <View style={[styles.classBlock, { backgroundColor: theme.surface, borderColor: isNow ? cls.color : theme.line }, isNow && { borderWidth: 1.5 }]}>
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
            <HwRow key={hw.id} hw={hw} theme={theme} onToggle={() => onToggleHw(hw.id)} />
          ))}
        </View>
      )}
    </View>
  );
}

function EventBlock({ ev, theme, onToggle }: { ev: CalEvent; theme: any; onToggle: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.eventBlock, { backgroundColor: theme.surface, borderColor: theme.line, borderLeftColor: theme.purple }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Text style={[styles.eventTime, { fontFamily: theme.fMono, color: theme.purple }]}>{ev.time}</Text>
      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{ev.title}</Text>
        {ev.location && (
          <Text style={[styles.eventLoc, { fontFamily: theme.fMono, color: theme.soft }]}>{ev.location}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TodayScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hwSheetClass, setHwSheetClass] = useState<Class | null>(null);
  const [showEvSheet, setShowEvSheet] = useState(false);

  const homework = useStore((s) => s.homework);
  const events = useStore((s) => s.events);
  const classes = useStore((s) => s.classes);
  const points = useStore((s) => s.points);
  const streak = useStore((s) => s.streak);
  const toggleHomework = useStore((s) => s.toggleHomework);
  const toggleEvent = useStore((s) => s.toggleEvent);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isToday = isSameDay(selectedDate, new Date());

  function isClassNow(cls: Class) {
    if (!isToday || !cls.start || !cls.end) return false;
    return nowMin >= timeToMinutes(cls.start) && nowMin <= timeToMinutes(cls.end);
  }

  const todayEvents = events.filter((e) => e.date && isSameDay(new Date(e.date), selectedDate));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
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
        <QuoteCard theme={theme} />

        {/* Class blocks */}
        {classes.map((cls) => {
          const classHw = homework.filter((h) => h.classId === cls.id);
          return (
            <ClassBlock
              key={cls.id}
              cls={cls}
              homework={classHw}
              isNow={isClassNow(cls)}
              theme={theme}
              onAddHw={() => setHwSheetClass(cls)}
              onToggleHw={toggleHomework}
            />
          );
        })}

        {/* Events */}
        {todayEvents.map((ev) => (
          <EventBlock key={ev.id} ev={ev} theme={theme} onToggle={() => toggleEvent(ev.id)} />
        ))}

        {classes.length === 0 && todayEvents.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { fontFamily: theme.fDisplayItalic, color: theme.sub }]}>
              Nothing due. Enjoy the day.
            </Text>
          </View>
        )}
      </ScrollView>

      <AddHomeworkSheet
        visible={!!hwSheetClass}
        onClose={() => setHwSheetClass(null)}
        defaultDate={selectedDate}
        defaultClass={hwSheetClass}
      />
      <AddEventSheet visible={showEvSheet} onClose={() => setShowEvSheet(false)} defaultDate={selectedDate} />
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
  screenTitle: { fontSize: 40, lineHeight: 48 },
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    marginBottom: 12,
  },
  quoteFuel: { fontSize: 10, letterSpacing: 1.5 },
  quoteText: { fontSize: 18, lineHeight: 26 },
  quoteAuthor: { fontSize: 12, letterSpacing: 0.3 },
  classBlock: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  classIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classEmoji: { fontSize: 22 },
  classInfo: { flex: 1 },
  className: { fontSize: 20, lineHeight: 24 },
  classMeta: { fontSize: 11, letterSpacing: 0.3, marginTop: 2 },
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
    borderRadius: 16,
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
    borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  hwCheckMark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hwInfo: { flex: 1, gap: 4 },
  hwTitle: { fontSize: 15, lineHeight: 20 },
  hwMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hwTag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  hwTagText: { fontSize: 10, letterSpacing: 0.3 },
  hwDue: { fontSize: 11, letterSpacing: 0.3 },
  eventBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  eventTime: { fontSize: 13, letterSpacing: 0.5, minWidth: 52 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15 },
  eventLoc: { fontSize: 11, letterSpacing: 0.5, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 22, textAlign: 'center' },
});
