import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { quoteOfDay } from '../../data/quotes';
import { POSITIVE_NEWS } from '../../data/news';
import DayPicker from '../../components/DayPicker';
import MicroLabel from '../../components/MicroLabel';
import SerifTitle from '../../components/SerifTitle';
import AddHomeworkSheet from '../sheets/AddHomeworkSheet';
import AddEventSheet from '../sheets/AddEventSheet';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function PointsChip({ points, streak, theme }: any) {
  return (
    <LinearGradient
      colors={theme.accentGrad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.pointsChip}
    >
      <Text style={[styles.pointsNum, { fontFamily: theme.fMono }]}>{points}</Text>
      <Text style={[styles.pointsLabel, { fontFamily: theme.fMono }]}>pts</Text>
      <View style={styles.streak}>
        <Text style={[styles.streakNum, { fontFamily: theme.fMono }]}>{streak}</Text>
        <Text style={[styles.streakFire, { fontFamily: theme.fMono }]}>🔥</Text>
      </View>
    </LinearGradient>
  );
}

function QuoteCard({ theme }: any) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const q = quoteOfDay(dateStr);
  return (
    <View style={[styles.quoteCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.quoteText, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
        “{q.text}”
      </Text>
      <Text style={[styles.quoteAuthor, { fontFamily: theme.fMono, color: theme.soft }]}>
        — {q.author}
      </Text>
    </View>
  );
}

function NewsTicker({ theme }: any) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const totalWidth = POSITIVE_NEWS.reduce((a, n) => a + n.text.length * 7.5 + 48, 0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -totalWidth,
        duration: totalWidth * 40,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.tickerWrap} pointerEvents="none">
      <Animated.View
        style={[styles.tickerRow, { transform: [{ translateX: scrollX }] }]}
      >
        {[...POSITIVE_NEWS, ...POSITIVE_NEWS].map((n, i) => (
          <Text
            key={i}
            style={[styles.tickerItem, { fontFamily: theme.fMono, color: theme.sub }]}
          >
            <Text style={{ color: theme.accent }}>{n.src}</Text>
            {'  '}{n.text}{'   ‧   '}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

function HwRow({ hw, theme, onToggle }: any) {
  const classColor = hw.classColor ?? theme.accent;
  return (
    <TouchableOpacity
      style={[
        styles.hwRow,
        { backgroundColor: theme.surface, borderColor: hw.done ? theme.line : classColor + '44' },
        hw.done && { opacity: 0.5 },
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.hwCheck, { borderColor: classColor, backgroundColor: hw.done ? classColor : 'transparent' }]}>
        {hw.done && <Text style={styles.hwCheckMark}>✓</Text>}
      </View>
      <View style={styles.hwInfo}>
        <Text style={[
          styles.hwTitle,
          { fontFamily: theme.fBodyMedium, color: theme.ink },
          hw.done && { textDecorationLine: 'line-through' },
        ]}>
          {hw.title}
        </Text>
        <Text style={[styles.hwMeta, { fontFamily: theme.fMono, color: theme.soft }]}>
          {hw.subject}  ·  {hw.due}
        </Text>
      </View>
      <View style={[styles.hwTag, { backgroundColor: classColor + '22' }]}>
        <Text style={[styles.hwTagText, { fontFamily: theme.fMono, color: classColor }]}>
          {hw.tag}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function EventBlock({ ev, theme, onToggle }: any) {
  return (
    <TouchableOpacity
      style={[styles.eventBlock, { backgroundColor: theme.purple + '22', borderLeftColor: theme.purple, borderColor: theme.line }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Text style={[styles.eventTime, { fontFamily: theme.fMono, color: theme.purple }]}>
        {ev.time}
      </Text>
      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>
          {ev.title}
        </Text>
        {ev.location && (
          <Text style={[styles.eventLoc, { fontFamily: theme.fMono, color: theme.soft }]}>
            {ev.location}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TodayScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showHwSheet, setShowHwSheet] = useState(false);
  const [showEvSheet, setShowEvSheet] = useState(false);
  const homework = useStore((s) => s.homework);
  const events = useStore((s) => s.events);
  const points = useStore((s) => s.points);
  const streak = useStore((s) => s.streak);
  const toggleHomework = useStore((s) => s.toggleHomework);
  const toggleEvent = useStore((s) => s.toggleEvent);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const todayHw = homework.filter((h) => isSameDay(new Date(h.dueDate), selectedDate));
  const todayEvents = events.filter((e) => isSameDay(new Date(e.date), selectedDate));

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  const dayLabel = isToday
    ? 'Today'
    : selectedDate.toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.dayLabel, { fontFamily: theme.fMono, color: theme.soft }]}>
            {dayLabel.toUpperCase()}
          </Text>
          <SerifTitle size={28}>plan.</SerifTitle>
        </View>
        <PointsChip points={points} streak={streak} theme={theme} />
      </View>

      <DayPicker selected={selectedDate} onSelect={setSelectedDate} />

      {isToday && <NewsTicker theme={theme} />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isToday && <QuoteCard theme={theme} />}

        {todayHw.length > 0 && (
          <View style={styles.section}>
            <MicroLabel style={styles.sectionLabel}>Homework</MicroLabel>
            {todayHw.map((hw) => (
              <HwRow key={hw.id} hw={hw} theme={theme} onToggle={() => toggleHomework(hw.id)} />
            ))}
          </View>
        )}

        {todayEvents.length > 0 && (
          <View style={styles.section}>
            <MicroLabel style={styles.sectionLabel}>Events</MicroLabel>
            {todayEvents.map((ev) => (
              <EventBlock key={ev.id} ev={ev} theme={theme} onToggle={() => toggleEvent(ev.id)} />
            ))}
          </View>
        )}

        {todayHw.length === 0 && todayEvents.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyIcon, { color: theme.soft }]}>✨</Text>
            <Text style={[styles.emptyText, { fontFamily: theme.fDisplayItalic, color: theme.sub }]}>
              Nothing due. Enjoy the day.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.fabRow, { bottom: 8 }]}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.surface, borderColor: theme.line }]}
          onPress={() => setShowEvSheet(true)}
        >
          <Text style={[styles.fabIcon, { color: theme.purple }]}>+</Text>
          <Text style={[styles.fabLabel, { fontFamily: theme.fMono, color: theme.purple }]}>event</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabPrimary]}
          onPress={() => setShowHwSheet(true)}
        >
          <LinearGradient
            colors={theme.accentGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGrad}
          >
            <Text style={[styles.fabIcon, { color: '#fff' }]}>+</Text>
            <Text style={[styles.fabLabel, { fontFamily: theme.fMono, color: '#fff' }]}>hw</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AddHomeworkSheet visible={showHwSheet} onClose={() => setShowHwSheet(false)} defaultDate={selectedDate} />
      <AddEventSheet visible={showEvSheet} onClose={() => setShowEvSheet(false)} defaultDate={selectedDate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dayLabel: { fontSize: 10, letterSpacing: 1.5 },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 4,
  },
  pointsNum: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pointsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  streak: { flexDirection: 'row', alignItems: 'center', marginLeft: 6, gap: 2 },
  streakNum: { color: '#fff', fontSize: 13 },
  streakFire: { fontSize: 12 },
  tickerWrap: { height: 28, overflow: 'hidden', marginBottom: 4 },
  tickerRow: { flexDirection: 'row', alignItems: 'center' },
  tickerItem: { fontSize: 11, letterSpacing: 0.3, whiteSpace: 'nowrap' } as any,
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  quoteText: { fontSize: 17, lineHeight: 26 },
  quoteAuthor: { fontSize: 11, letterSpacing: 0.5 },
  section: { gap: 8 },
  sectionLabel: { marginBottom: 4 },
  hwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  hwCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hwCheckMark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hwInfo: { flex: 1, gap: 2 },
  hwTitle: { fontSize: 15 },
  hwMeta: { fontSize: 10, letterSpacing: 0.5 },
  hwTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hwTagText: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  eventBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventTime: { fontSize: 13, letterSpacing: 0.5, minWidth: 44 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15 },
  eventLoc: { fontSize: 11, letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 22, textAlign: 'center' },
  fabRow: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fabPrimary: { borderRadius: 100, overflow: 'hidden' },
  fabGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fabIcon: { fontSize: 18, fontWeight: '700' },
  fabLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
});
