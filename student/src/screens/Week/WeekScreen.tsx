import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { getClosedReason } from '../../data/schoolClosed';
import { Class, CalEvent } from '../../types';
import AddEventSheet from '../sheets/AddEventSheet';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const START_HOUR = 8;
const END_HOUR = 18;
const ROW_H = 64;
const GUTTER = 48;

function getWeekDays(anchor: Date): Date[] {
  const monday = new Date(anchor);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
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

function parseTimeToMinutes(t: string): number | null {
  const match = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const ampm = match[3]?.toLowerCase();
  if (ampm === 'pm' && h !== 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return h * 60 + m;
}

export default function WeekScreen() {
  const today = new Date();
  const [anchor, setAnchor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(today);
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [addEventTime, setAddEventTime] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  const homework = useStore((s) => s.homework);
  const classes = useStore((s) => s.classes);
  const events = useStore((s) => s.events);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  const weekDays = getWeekDays(anchor);
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
  const monthLabel = selectedDay.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  const isWeekend = selectedDay.getDay() === 0 || selectedDay.getDay() === 6;
  const closedReason = !isWeekend ? getClosedReason(selectedDay) : null;
  const canAdd = !isWeekend && !closedReason;

  const dayClasses = isWeekend || closedReason ? [] : classes.filter((c) => c.start && c.end);
  const dayEvents = events.filter((ev) => ev.date && isSameDay(new Date(ev.date), selectedDay));
  const dayHomework = homework.filter((h) => h.dueDate && isSameDay(new Date(h.dueDate), selectedDay) && !h.done);

  function prevWeek() {
    const d = new Date(anchor);
    d.setDate(d.getDate() - 7);
    setAnchor(d);
    // Keep selected day in the same relative position
    const sel = new Date(selectedDay);
    sel.setDate(sel.getDate() - 7);
    setSelectedDay(sel);
  }

  function nextWeek() {
    const d = new Date(anchor);
    d.setDate(d.getDate() + 7);
    setAnchor(d);
    const sel = new Date(selectedDay);
    sel.setDate(sel.getDate() + 7);
    setSelectedDay(sel);
  }

  const gridH = hours.length * ROW_H;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>week.</Text>
          <Text style={[styles.monthLabel, { fontFamily: theme.fMono, color: theme.sub }]}>
            {monthLabel.toUpperCase()}
          </Text>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: theme.accent }]}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: theme.accent }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day strip */}
      <View style={[styles.dayStrip, { borderBottomColor: theme.line }]}>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDay);
          const isOff = day.getDay() === 0 || day.getDay() === 6;
          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={styles.dayPill}
              onPress={() => setSelectedDay(day)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayAbbr,
                { fontFamily: theme.fMono, color: isSelected ? theme.accent : isOff ? theme.soft : theme.sub },
              ]}>
                {DAY_ABBR[day.getDay()]}
              </Text>
              <View style={[
                styles.dayNumWrap,
                isSelected && { backgroundColor: theme.accent },
                isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.accent },
              ]}>
                <Text style={[
                  styles.dayNum,
                  {
                    fontFamily: isToday || isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    color: isSelected ? '#fff' : isToday ? theme.accent : isOff ? theme.soft : theme.ink,
                  },
                ]}>
                  {day.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day grid */}
      <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false}>
        <View style={{ height: gridH, position: 'relative' }}>

          {/* Hour rows */}
          {hours.map((hour, i) => (
            <TouchableOpacity
              key={hour}
              style={[styles.hourRow, { top: i * ROW_H, borderTopColor: theme.line }]}
              onPress={() => {
                if (!canAdd) return;
                setAddEventDate(selectedDay);
                setAddEventTime(`${hour}:00`);
              }}
              activeOpacity={canAdd ? 0.4 : 1}
            >
              <Text style={[styles.timeLabel, { fontFamily: theme.fMono, color: theme.soft, width: GUTTER }]}>
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </Text>
              <View style={[styles.hourLine, { backgroundColor: theme.line }]} />
            </TouchableOpacity>
          ))}

          {/* Closed banner */}
          {closedReason && (
            <View style={[styles.closedBanner, { backgroundColor: theme.surface + 'ee', left: GUTTER }]}>
              <Text style={[styles.closedLabel, { fontFamily: theme.fMono, color: theme.soft }]}>
                {closedReason.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Class blocks */}
          {dayClasses.map((cls) => {
            const startMin = timeToMinutes(cls.start!);
            const endMin = timeToMinutes(cls.end!);
            const top = (startMin - START_HOUR * 60) / 60 * ROW_H;
            const blockH = Math.max((endMin - startMin) / 60 * ROW_H - 3, 24);
            return (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.block,
                  {
                    top,
                    left: GUTTER + 6,
                    right: 6,
                    height: blockH,
                    backgroundColor: cls.color + '22',
                    borderLeftColor: cls.color,
                  },
                ]}
                onPress={() => setSelectedClass(cls)}
                activeOpacity={0.8}
              >
                <Text style={[styles.blockTitle, { fontFamily: theme.fMono, color: cls.color }]} numberOfLines={1}>
                  {cls.emoji ? `${cls.emoji} ` : ''}{cls.name}
                </Text>
                <Text style={[styles.blockTime, { fontFamily: theme.fMono, color: cls.color + 'aa' }]}>
                  {cls.start} – {cls.end}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Event blocks */}
          {dayEvents.map((ev) => {
            const startMin = ev.time ? parseTimeToMinutes(ev.time) : null;
            if (startMin === null || startMin < START_HOUR * 60 || startMin >= END_HOUR * 60) return null;
            const endLabel = ev.endTime ? parseTimeToMinutes(ev.endTime) : null;
            const blockH = endLabel ? Math.max((endLabel - startMin) / 60 * ROW_H - 3, 32) : ROW_H - 3;
            const top = (startMin - START_HOUR * 60) / 60 * ROW_H;
            return (
              <TouchableOpacity
                key={ev.id}
                style={[
                  styles.block,
                  {
                    top,
                    left: GUTTER + 6,
                    right: 6,
                    height: blockH,
                    backgroundColor: theme.accent + '22',
                    borderLeftColor: theme.accent,
                  },
                ]}
                onPress={() => setSelectedEvent(ev)}
                activeOpacity={0.8}
              >
                <Text style={[styles.blockTitle, { fontFamily: theme.fMono, color: theme.accent }]} numberOfLines={1}>
                  {ev.icon ? `${ev.icon} ` : ''}{ev.title}
                </Text>
                {ev.time && (
                  <Text style={[styles.blockTime, { fontFamily: theme.fMono, color: theme.accent + 'aa' }]}>
                    {ev.time}{ev.endTime ? ` – ${ev.endTime}` : ''}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Homework chips at top */}
          {dayHomework.length > 0 && (
            <View style={[styles.hwRow, { left: GUTTER + 6, top: 6 }]}>
              {dayHomework.map((hw) => {
                const color = hw.classColor ?? theme.accent;
                return (
                  <View key={hw.id} style={[styles.hwChip, { backgroundColor: color + '22', borderColor: color + '66' }]}>
                    <Text style={[styles.hwChipText, { fontFamily: theme.fMono, color }]} numberOfLines={1}>
                      {hw.title}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

        </View>
      </ScrollView>

      <AddEventSheet
        visible={!!addEventDate}
        onClose={() => setAddEventDate(null)}
        defaultDate={addEventDate ?? undefined}
        defaultTime={addEventTime}
      />

      {/* Class detail */}
      <Modal visible={!!selectedClass} transparent animationType="fade" onRequestClose={() => setSelectedClass(null)}>
        <TouchableOpacity style={detailStyles.backdrop} activeOpacity={1} onPress={() => setSelectedClass(null)}>
          <View style={[detailStyles.card, { backgroundColor: theme.bg, borderColor: selectedClass?.color ?? theme.line }]}
            onStartShouldSetResponder={() => true}>
            <View style={[detailStyles.colorBar, { backgroundColor: selectedClass?.color }]} />
            <View style={detailStyles.body}>
              <Text style={[detailStyles.cardTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
                {selectedClass?.emoji ?? '📚'}  {selectedClass?.name}
              </Text>
              {selectedClass?.teacher && (
                <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {selectedClass.teacher}
                </Text>
              )}
              {selectedClass?.start && (
                <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: selectedClass.color }]}>
                  {selectedClass.start} – {selectedClass.end}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedClass(null)}>
              <Text style={[detailStyles.closeX, { color: theme.soft }]}>×</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Event detail */}
      <Modal visible={!!selectedEvent} transparent animationType="fade" onRequestClose={() => setSelectedEvent(null)}>
        <TouchableOpacity style={detailStyles.backdrop} activeOpacity={1} onPress={() => setSelectedEvent(null)}>
          <View style={[detailStyles.card, { backgroundColor: theme.bg, borderColor: theme.accent }]}
            onStartShouldSetResponder={() => true}>
            <View style={[detailStyles.colorBar, { backgroundColor: theme.accent }]} />
            <View style={detailStyles.body}>
              <Text style={[detailStyles.cardTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
                {selectedEvent?.title}
              </Text>
              {selectedEvent?.time && (
                <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: theme.accent }]}>
                  {selectedEvent.time}{selectedEvent.endTime ? ` – ${selectedEvent.endTime}` : ''}
                </Text>
              )}
              {selectedEvent?.date && (
                <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {new Date(selectedEvent.date).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              )}
              {selectedEvent?.location && (
                <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: theme.soft }]}>
                  📍 {selectedEvent.location}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedEvent(null)}>
              <Text style={[detailStyles.closeX, { color: theme.soft }]}>×</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const detailStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 32, borderWidth: 1, flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden' },
  colorBar: { width: 5 },
  body: { flex: 1, padding: 16, gap: 6 },
  cardTitle: { fontSize: 22, lineHeight: 28 },
  cardMeta: { fontSize: 12, letterSpacing: 0.3 },
  closeX: { fontSize: 24, lineHeight: 28, paddingHorizontal: 14, paddingTop: 12 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: { gap: 2 },
  title: { fontSize: 28 },
  monthLabel: { fontSize: 10, letterSpacing: 1.5 },
  navRow: { flexDirection: 'row', gap: 4, paddingBottom: 4 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 18 },
  dayStrip: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 10,
    paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayPill: { flex: 1, alignItems: 'center', gap: 4 },
  dayAbbr: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
  dayNumWrap: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  dayNum: { fontSize: 15 },
  gridScroll: { flex: 1 },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW_H,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  timeLabel: { fontSize: 10, letterSpacing: 0.3, textAlign: 'right', paddingRight: 10 },
  hourLine: { flex: 1, height: StyleSheet.hairlineWidth, marginTop: 7 },
  block: {
    position: 'absolute',
    borderRadius: 28,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
    gap: 2,
  },
  blockTitle: { fontSize: 12, letterSpacing: 0.2 },
  blockTime: { fontSize: 10, letterSpacing: 0.2 },
  closedBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedLabel: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.5 },
  hwRow: { position: 'absolute', right: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  hwChip: { borderRadius: 32, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  hwChipText: { fontSize: 10, letterSpacing: 0.2 },
});
