import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8);

function getWeekDays(anchor: Date): Date[] {
  const days: Date[] = [];
  const monday = new Date(anchor);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function WeekHwChip({ hw, theme }: any) {
  const color = hw.classColor ?? theme.accent;
  return (
    <View style={[styles.hwChip, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[styles.hwChipText, { fontFamily: theme.fMono, color }]} numberOfLines={1}>
        {hw.title}
      </Text>
    </View>
  );
}

export default function WeekScreen() {
  const [anchor, setAnchor] = useState(new Date());
  const homework = useStore((s) => s.homework);
  const classes = useStore((s) => s.classes);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const weekDays = getWeekDays(anchor);
  const today = new Date();

  function prevWeek() {
    const d = new Date(anchor);
    d.setDate(d.getDate() - 7);
    setAnchor(d);
  }

  function nextWeek() {
    const d = new Date(anchor);
    d.setDate(d.getDate() + 7);
    setAnchor(d);
  }

  const monthLabel = anchor.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <SerifTitle size={28}>week.</SerifTitle>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: theme.accent }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { fontFamily: theme.fMono, color: theme.sub }]}>
            {monthLabel.toUpperCase()}
          </Text>
          <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: theme.accent }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal={isLandscape} showsHorizontalScrollIndicator={false}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Day header row */}
          <View style={[styles.dayHeaderRow, isLandscape && { width: weekDays.length * 180 }]}>
            <View style={styles.timeGutter} />
            {weekDays.map((day) => {
              const isToday = isSameDay(day, today);
              return (
                <View
                  key={day.toISOString()}
                  style={[
                    styles.dayHeader,
                    isLandscape && { width: 180 },
                    isToday && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
                  ]}
                >
                  <Text style={[styles.dayAbbr, { fontFamily: theme.fMono, color: isToday ? theme.accent : theme.soft }]}>
                    {DAY_ABBR[day.getDay()]}
                  </Text>
                  <Text style={[styles.dayNum, { fontFamily: theme.fBodySemiBold, color: isToday ? theme.accent : theme.ink }]}>
                    {day.getDate()}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <View key={hour} style={[styles.hourRow, isLandscape && { width: weekDays.length * 180 + 48 }]}>
              <View style={styles.timeGutter}>
                <Text style={[styles.timeLabel, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {hour}:00
                </Text>
              </View>
              {weekDays.map((day) => {
                const dayHw = homework.filter((h) => {
                  const due = new Date(h.dueDate);
                  return isSameDay(due, day);
                });
                const cls = classes.find((c) => c.period === hour - 7);
                return (
                  <View
                    key={day.toISOString()}
                    style={[
                      styles.cell,
                      isLandscape && { width: 180 },
                      { borderColor: theme.line },
                    ]}
                  >
                    {cls && hour === 8 + (cls.period ?? 1) - 1 && (
                      <View style={[styles.classBlock, { backgroundColor: cls.color + '22', borderLeftColor: cls.color }]}>
                        <Text style={[styles.classBlockText, { fontFamily: theme.fMono, color: cls.color }]} numberOfLines={1}>
                          {cls.name}
                        </Text>
                      </View>
                    )}
                    {hour === 8 && dayHw.map((hw) => (
                      <WeekHwChip key={hw.id} hw={hw} theme={theme} />
                    ))}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navBtn: { padding: 4 },
  navArrow: { fontSize: 18 },
  monthLabel: { fontSize: 11, letterSpacing: 1.5 },
  dayHeaderRow: { flexDirection: 'row', paddingBottom: 4 },
  timeGutter: { width: 48 },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 6,
    gap: 2,
  },
  dayAbbr: { fontSize: 10, letterSpacing: 1 },
  dayNum: { fontSize: 18 },
  hourRow: { flexDirection: 'row', minHeight: 60 },
  timeLabel: { fontSize: 9, letterSpacing: 0.5, paddingTop: 4, textAlign: 'center' },
  cell: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
    minHeight: 60,
    gap: 2,
  },
  classBlock: {
    borderRadius: 4,
    borderLeftWidth: 3,
    padding: 4,
  },
  classBlockText: { fontSize: 10, letterSpacing: 0.3 },
  hwChip: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  hwChipText: { fontSize: 9, letterSpacing: 0.3 },
});
