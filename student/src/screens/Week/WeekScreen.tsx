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
import { getClosedReason } from '../../data/schoolClosed';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const START_HOUR = 8;
const END_HOUR = 17;
const ROW_H = 56;
const COL_W = 110;
const GUTTER = 44;

function getWeekDays(anchor: Date): Date[] {
  const days: Date[] = [];
  const monday = new Date(anchor);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  for (let i = 0; i < 7; i++) {
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

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function WeekScreen() {
  const [anchor, setAnchor] = useState(new Date());
  const homework = useStore((s) => s.homework);
  const classes = useStore((s) => s.classes);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const { width, height } = useWindowDimensions();

  const weekDays = getWeekDays(anchor);
  const today = new Date();
  const totalWidth = GUTTER + COL_W * 7;
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
  const gridHeight = height - 160; // approx header + day-header + safe area

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>week.</Text>
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

      {/* Scrollable grid — horizontal to see all 7 days */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ width: totalWidth }}
      >
        <View style={{ width: totalWidth }}>

          {/* Day name headers */}
          <View style={[styles.dayHeaderRow, { borderBottomColor: theme.line }]}>
            <View style={{ width: GUTTER }} />
            {weekDays.map((day) => {
              const isToday = isSameDay(day, today);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const closed = !isWeekend && getClosedReason(day);
              return (
                <View
                  key={day.toISOString()}
                  style={[
                    styles.dayHeader,
                    { width: COL_W },
                    isToday && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
                  ]}
                >
                  <Text style={[styles.dayAbbr, { fontFamily: theme.fMono, color: isToday ? theme.accent : isWeekend ? theme.soft : theme.sub }]}>
                    {DAY_ABBR[day.getDay()]}
                  </Text>
                  <Text style={[styles.dayNum, { fontFamily: isToday ? 'Inter_600SemiBold' : 'Inter_400Regular', color: isToday ? theme.accent : theme.ink }]}>
                    {day.getDate()}
                  </Text>
                  {(isWeekend || closed) && (
                    <Text style={[styles.dayTag, { fontFamily: theme.fMono, color: theme.soft }]}>
                      {isWeekend ? 'off' : 'pro-d'}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Hour grid — scrollable vertically */}
          <ScrollView
            style={{ height: gridHeight }}
            showsVerticalScrollIndicator={false}
          >
            {/* Class blocks — absolutely positioned inside a relative container */}
            <View style={{ height: hours.length * ROW_H, position: 'relative' }}>

              {/* Hour grid lines */}
              {hours.map((hour, i) => (
                <View
                  key={hour}
                  style={[styles.hourRow, { top: i * ROW_H, borderTopColor: theme.line }]}
                >
                  <View style={[styles.timeGutter, { width: GUTTER }]}>
                    <Text style={[styles.timeLabel, { fontFamily: theme.fMono, color: theme.soft }]}>
                      {hour}:00
                    </Text>
                  </View>
                  {weekDays.map((day) => (
                    <View
                      key={day.toISOString()}
                      style={[styles.cell, { width: COL_W, borderLeftColor: theme.line }]}
                    />
                  ))}
                </View>
              ))}

              {/* Class blocks per day column */}
              {weekDays.map((day, dayIdx) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const closed = !isWeekend && getClosedReason(day);
                if (isWeekend || closed) return null;

                return classes.map((cls) => {
                  if (!cls.start || !cls.end) return null;
                  const startMin = timeToMinutes(cls.start);
                  const endMin = timeToMinutes(cls.end);
                  const top = (startMin - START_HOUR * 60) / 60 * ROW_H;
                  const blockH = (endMin - startMin) / 60 * ROW_H;
                  const left = GUTTER + dayIdx * COL_W + 2;

                  return (
                    <View
                      key={`${day.toISOString()}-${cls.id}`}
                      style={[
                        styles.classBlock,
                        {
                          top,
                          left,
                          width: COL_W - 4,
                          height: blockH - 2,
                          backgroundColor: cls.color + '33',
                          borderLeftColor: cls.color,
                        },
                      ]}
                    >
                      <Text style={[styles.classBlockName, { fontFamily: theme.fMono, color: cls.color }]} numberOfLines={2}>
                        {cls.name}
                      </Text>
                      <Text style={[styles.classBlockTime, { fontFamily: theme.fMono, color: cls.color + 'aa' }]}>
                        {cls.start}
                      </Text>
                    </View>
                  );
                });
              })}

              {/* Homework chips — placed at the top of the due day column */}
              {weekDays.map((day, dayIdx) => {
                const dayHw = homework.filter((h) => h.dueDate && isSameDay(new Date(h.dueDate), day) && !h.done);
                if (dayHw.length === 0) return null;
                const left = GUTTER + dayIdx * COL_W + 2;
                return dayHw.map((hw, hwIdx) => {
                  const color = hw.classColor ?? theme.accent;
                  return (
                    <View
                      key={hw.id}
                      style={[
                        styles.hwChip,
                        {
                          top: hwIdx * 20 + 4,
                          left,
                          width: COL_W - 8,
                          backgroundColor: color + '22',
                          borderColor: color + '66',
                        },
                      ]}
                    >
                      <Text style={[styles.hwChipText, { fontFamily: theme.fMono, color }]} numberOfLines={1}>
                        {hw.title}
                      </Text>
                    </View>
                  );
                });
              })}

            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 28 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navBtn: { padding: 4 },
  navArrow: { fontSize: 18 },
  monthLabel: { fontSize: 11, letterSpacing: 1.5 },
  dayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 6,
  },
  dayHeader: {
    alignItems: 'center',
    paddingBottom: 4,
    gap: 1,
  },
  dayAbbr: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  dayNum: { fontSize: 17 },
  dayTag: { fontSize: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW_H,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  timeGutter: {
    justifyContent: 'flex-start',
    paddingTop: 3,
    paddingLeft: 4,
  },
  timeLabel: { fontSize: 9, letterSpacing: 0.3 },
  cell: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  classBlock: {
    position: 'absolute',
    borderRadius: 4,
    borderLeftWidth: 3,
    padding: 4,
    overflow: 'hidden',
  },
  classBlockName: { fontSize: 9, letterSpacing: 0.3, lineHeight: 12 },
  classBlockTime: { fontSize: 8, letterSpacing: 0.3 },
  hwChip: {
    position: 'absolute',
    borderRadius: 3,
    borderWidth: 1,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  hwChipText: { fontSize: 8, letterSpacing: 0.2 },
});
