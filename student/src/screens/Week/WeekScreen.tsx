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
import AddEventSheet from '../sheets/AddEventSheet';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const START_HOUR = 8;
const END_HOUR = 17;
const ROW_H = 56;
const COL_W = 110;
const GUTTER = 40;
const DAY_HDR_H = 54;

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
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [addEventTime, setAddEventTime] = useState('');
  const homework = useStore((s) => s.homework);
  const classes = useStore((s) => s.classes);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const { height } = useWindowDimensions();

  const weekDays = getWeekDays(anchor);
  const today = new Date();
  const totalDayWidth = COL_W * 7;
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
  const gridContentHeight = DAY_HDR_H + hours.length * ROW_H;
  const scrollAreaHeight = height - 120;

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

      {/* Grid area */}
      <View style={[styles.gridArea, { height: scrollAreaHeight }]}>

        {/* Horizontally scrollable day columns — full width, padded left by GUTTER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingLeft: GUTTER }}
        >
          <ScrollView
            style={{ width: totalDayWidth }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View style={{ height: gridContentHeight, position: 'relative', width: totalDayWidth }}>

              {/* Day name headers */}
              <View style={[styles.dayHeaderRow, { height: DAY_HDR_H, borderBottomColor: theme.line }]}>
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

              {/* Hour grid lines */}
              {hours.map((hour, i) => (
                <View
                  key={hour}
                  style={[
                    styles.hourRow,
                    {
                      top: DAY_HDR_H + i * ROW_H,
                      width: totalDayWidth,
                      borderTopColor: theme.line,
                    },
                  ]}
                >
                  {weekDays.map((day) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const closed = !isWeekend && getClosedReason(day);
                    return (
                      <TouchableOpacity
                        key={day.toISOString()}
                        style={[styles.cell, { width: COL_W, borderLeftColor: theme.line }]}
                        onPress={() => {
                          if (isWeekend || closed) return;
                          setAddEventDate(day);
                          setAddEventTime(`${hour}:00`);
                        }}
                        activeOpacity={0.5}
                      />
                    );
                  })}
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
                  const top = DAY_HDR_H + (startMin - START_HOUR * 60) / 60 * ROW_H;
                  const blockH = (endMin - startMin) / 60 * ROW_H;
                  const left = dayIdx * COL_W + 2;

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
                const left = dayIdx * COL_W + 2;
                return dayHw.map((hw, hwIdx) => {
                  const color = hw.classColor ?? theme.accent;
                  return (
                    <View
                      key={hw.id}
                      style={[
                        styles.hwChip,
                        {
                          top: DAY_HDR_H + hwIdx * 20 + 4,
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
        </ScrollView>

        {/* Time gutter — absolutely positioned on top so day content scrolls behind it */}
        <View style={[styles.gutterOverlay, { backgroundColor: theme.bg, borderRightColor: theme.line }]}>
          <View style={{ height: DAY_HDR_H }} />
          {hours.map((hour) => (
            <View key={hour} style={[styles.gutterRow, { height: ROW_H, borderTopColor: theme.line }]}>
              <Text style={[styles.timeLabel, { fontFamily: theme.fMono, color: theme.soft }]}>
                {hour}:00
              </Text>
            </View>
          ))}
        </View>
      </View>

      <AddEventSheet
        visible={!!addEventDate}
        onClose={() => setAddEventDate(null)}
        defaultDate={addEventDate ?? undefined}
        defaultTime={addEventTime}
      />
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
  gridArea: {
    flex: 1,
    position: 'relative',
  },
  gutterOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: GUTTER,
    zIndex: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  gutterRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-start',
    paddingTop: 3,
    paddingLeft: 4,
  },
  timeLabel: { fontSize: 9, letterSpacing: 0.3 },
  dayHeaderRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayHeader: {
    alignItems: 'center',
    paddingBottom: 4,
    paddingTop: 6,
    gap: 1,
  },
  dayAbbr: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  dayNum: { fontSize: 17 },
  dayTag: { fontSize: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  hourRow: {
    position: 'absolute',
    left: 0,
    height: ROW_H,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    height: ROW_H,
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
