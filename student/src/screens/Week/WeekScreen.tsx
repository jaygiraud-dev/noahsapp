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
import { getClosedReason, SCHOOL_CLOSED } from '../../data/schoolClosed';
import { Class, CalEvent } from '../../types';
import AddEventSheet from '../sheets/AddEventSheet';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ABBR_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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

function getMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay(); // 0=Sun
  const cells: (Date | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CLOSED_MAP = new Map(SCHOOL_CLOSED.map((d) => [d.date, d.label]));

function closedDotColor(label: string): string {
  if (label.includes('Break')) return '#06d6e0';
  if (label.includes('Pro-D') || label.includes('Curriculum')) return '#f59e0b';
  return '#f87171';
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

function fmt12h(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
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
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [anchor, setAnchor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(today);
  const [monthAnchor, setMonthAnchor] = useState({ year: today.getFullYear(), month: today.getMonth() });
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

  const isWeekend = selectedDay.getDay() === 0 || selectedDay.getDay() === 6;
  const closedReason = !isWeekend ? getClosedReason(selectedDay) : null;
  const canAdd = !isWeekend && !closedReason;

  const dayClasses = isWeekend || closedReason ? [] : classes.filter((c) => c.start && c.end);
  const dayEvents = events.filter((ev) => ev.date && isSameDay(new Date(ev.date), selectedDay));
  const dayHomework = homework.filter((h) => h.dueDate && isSameDay(new Date(h.dueDate), selectedDay) && !h.done);

  const monthLabel = viewMode === 'month'
    ? new Date(monthAnchor.year, monthAnchor.month, 1).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
    : selectedDay.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  function prevWeek() {
    const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d);
    const sel = new Date(selectedDay); sel.setDate(sel.getDate() - 7); setSelectedDay(sel);
  }
  function nextWeek() {
    const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d);
    const sel = new Date(selectedDay); sel.setDate(sel.getDate() + 7); setSelectedDay(sel);
  }
  function prevMonth() {
    setMonthAnchor((p) => {
      const m = p.month === 0 ? 11 : p.month - 1;
      const y = p.month === 0 ? p.year - 1 : p.year;
      return { year: y, month: m };
    });
  }
  function nextMonth() {
    setMonthAnchor((p) => {
      const m = p.month === 11 ? 0 : p.month + 1;
      const y = p.month === 11 ? p.year + 1 : p.year;
      return { year: y, month: m };
    });
  }

  function selectDayFromMonth(day: Date) {
    setSelectedDay(day);
    setAnchor(day);
    setViewMode('day');
  }

  const monthDays = getMonthDays(monthAnchor.year, monthAnchor.month);
  const gridH = hours.length * ROW_H;

  // ─── Month view ──────────────────────────────────────────────────────────────
  const MonthView = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Weekday header */}
      <View style={mStyles.weekRow}>
        {DAY_ABBR_SHORT.map((d, i) => (
          <View key={i} style={mStyles.weekCell}>
            <Text style={[mStyles.weekLabel, { fontFamily: theme.fMono, color: theme.soft }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={mStyles.grid}>
        {monthDays.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={mStyles.cell} />;

          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDay);
          const isOff = day.getDay() === 0 || day.getDay() === 6;
          const key = dateKey(day);
          const closedLabel = CLOSED_MAP.get(key);
          const dotColor = closedLabel ? closedDotColor(closedLabel) : null;

          const dayEvents2 = events.filter((ev) => ev.date && isSameDay(new Date(ev.date), day));
          const dayHw = homework.filter((h) => h.dueDate && isSameDay(new Date(h.dueDate), day) && !h.done);
          const hasPersonal = dayEvents2.length > 0 || dayHw.length > 0;

          return (
            <TouchableOpacity
              key={key}
              style={[
                mStyles.cell,
                closedLabel && !isOff && { backgroundColor: dotColor + '18' },
              ]}
              onPress={() => selectDayFromMonth(day)}
              activeOpacity={0.7}
            >
              <View style={[
                mStyles.dayCircle,
                isSelected && { backgroundColor: theme.accent },
                isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.accent },
              ]}>
                <Text style={[
                  mStyles.dayNum,
                  {
                    fontFamily: isToday || isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    color: isSelected ? '#fff' : isOff ? theme.soft : closedLabel ? theme.sub : theme.ink,
                    opacity: isOff ? 0.4 : 1,
                  },
                ]}>
                  {day.getDate()}
                </Text>
              </View>
              {/* Dots row */}
              <View style={mStyles.dotRow}>
                {dotColor && <View style={[mStyles.dot, { backgroundColor: dotColor }]} />}
                {hasPersonal && <View style={[mStyles.dot, { backgroundColor: theme.accent }]} />}
              </View>
              {/* Holiday label */}
              {closedLabel && (
                <Text style={[mStyles.holidayLabel, { fontFamily: theme.fMono, color: dotColor ?? theme.soft }]} numberOfLines={1}>
                  {closedLabel}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={[mStyles.legend, { borderTopColor: theme.line }]}>
        {[
          { color: '#f87171', label: 'Holiday' },
          { color: '#f59e0b', label: 'Pro-D Day' },
          { color: '#06d6e0', label: 'School Break' },
          { color: theme.accent, label: 'Your events' },
        ].map((item) => (
          <View key={item.label} style={mStyles.legendItem}>
            <View style={[mStyles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[mStyles.legendLabel, { fontFamily: theme.fMono, color: theme.soft }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
            {viewMode === 'month' ? 'month.' : 'week.'}
          </Text>
          <Text style={[styles.monthLabel, { fontFamily: theme.fMono, color: theme.sub }]}>
            {monthLabel.toUpperCase()}
          </Text>
        </View>
        <View style={styles.navRow}>
          {viewMode === 'day' ? (
            <>
              <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
                <Text style={[styles.navArrow, { color: theme.accent }]}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
                <Text style={[styles.navArrow, { color: theme.accent }]}>→</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <Text style={[styles.navArrow, { color: theme.accent }]}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <Text style={[styles.navArrow, { color: theme.accent }]}>→</Text>
              </TouchableOpacity>
            </>
          )}
          {/* Toggle button */}
          <TouchableOpacity
            style={[styles.toggleViewBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
            onPress={() => {
              if (viewMode === 'day') {
                setMonthAnchor({ year: selectedDay.getFullYear(), month: selectedDay.getMonth() });
                setViewMode('month');
              } else {
                setViewMode('day');
              }
            }}
          >
            <Text style={[styles.toggleViewText, { fontFamily: theme.fMono, color: theme.accent }]}>
              {viewMode === 'day' ? '⊞' : '≡'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'month' ? (
        <MonthView />
      ) : (
        <>
          {/* Day strip */}
          <View style={[styles.dayStrip, { borderBottomColor: theme.line }]}>
            {weekDays.map((day) => {
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDay);
              const isOff = day.getDay() === 0 || day.getDay() === 6;
              const key = dateKey(day);
              const closedEntry = !isOff ? SCHOOL_CLOSED.find((d) => d.date === key) : undefined;
              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={styles.dayPill}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayAbbr, { fontFamily: theme.fMono, color: isSelected ? theme.accent : isOff ? theme.soft : theme.sub }]}>
                    {DAY_ABBR[day.getDay()]}
                  </Text>
                  <View style={[
                    styles.dayNumWrap,
                    isSelected && { backgroundColor: theme.accent },
                    isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.accent },
                  ]}>
                    <Text style={[styles.dayNum, {
                      fontFamily: isToday || isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      color: isSelected ? '#fff' : isToday ? theme.accent : isOff ? theme.soft : theme.ink,
                    }]}>
                      {day.getDate()}
                    </Text>
                  </View>
                  {closedEntry && (
                    <View style={[styles.closedDot, { backgroundColor: closedDotColor(closedEntry.label) }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Day grid */}
          <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false}>
            <View style={{ height: gridH, position: 'relative' }}>
              {hours.map((hour, i) => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.hourRow, { top: i * ROW_H, borderTopColor: theme.line }]}
                  onPress={() => { if (!canAdd) return; setAddEventDate(selectedDay); setAddEventTime(`${hour}:00`); }}
                  activeOpacity={canAdd ? 0.4 : 1}
                >
                  <Text style={[styles.timeLabel, { fontFamily: theme.fMono, color: theme.soft, width: GUTTER }]}>
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </Text>
                  <View style={[styles.hourLine, { backgroundColor: theme.line }]} />
                </TouchableOpacity>
              ))}

              {closedReason && (
                <View style={[styles.closedBanner, { backgroundColor: theme.surface + 'ee', left: GUTTER }]}>
                  <View style={[styles.closedPill, { backgroundColor: closedDotColor(closedReason) + '22', borderColor: closedDotColor(closedReason) + '55' }]}>
                    <Text style={[styles.closedLabel, { fontFamily: theme.fMono, color: closedDotColor(closedReason) }]}>
                      {closedReason.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.closedSub, { fontFamily: theme.fMono, color: theme.soft }]}>
                    SD44 · No school
                  </Text>
                </View>
              )}

              {dayClasses.map((cls) => {
                const startMin = timeToMinutes(cls.start!);
                const endMin = timeToMinutes(cls.end!);
                const top = (startMin - START_HOUR * 60) / 60 * ROW_H;
                const blockH = Math.max((endMin - startMin) / 60 * ROW_H - 3, 36);
                return (
                  <TouchableOpacity key={cls.id} style={[styles.block, { top, left: GUTTER + 6, right: 6, height: blockH, backgroundColor: cls.color + '22', borderLeftColor: cls.color, zIndex: startMin }]} onPress={() => setSelectedClass(cls)} activeOpacity={0.8}>
                    <Text style={[styles.blockTitle, { fontFamily: theme.fMono, color: cls.color }]} numberOfLines={2}>
                      {cls.emoji ? `${cls.emoji} ` : ''}{cls.name || 'Class'}
                    </Text>
                    <Text style={[styles.blockTime, { fontFamily: theme.fMono, color: cls.color + 'bb' }]}>
                      {fmt12h(cls.start!)} – {fmt12h(cls.end!)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {dayEvents.map((ev) => {
                const startMin = ev.time ? parseTimeToMinutes(ev.time) : null;
                if (startMin === null || startMin < START_HOUR * 60 || startMin >= END_HOUR * 60) return null;
                const endLabel = ev.endTime ? parseTimeToMinutes(ev.endTime) : null;
                const blockH = endLabel ? Math.max((endLabel - startMin) / 60 * ROW_H - 3, 32) : ROW_H - 3;
                const top = (startMin - START_HOUR * 60) / 60 * ROW_H;
                return (
                  <TouchableOpacity key={ev.id} style={[styles.block, { top, left: GUTTER + 6, right: 6, height: blockH, backgroundColor: theme.accent + '22', borderLeftColor: theme.accent }]} onPress={() => setSelectedEvent(ev)} activeOpacity={0.8}>
                    <Text style={[styles.blockTitle, { fontFamily: theme.fMono, color: theme.accent }]} numberOfLines={2}>
                      {ev.icon ? `${ev.icon} ` : ''}{ev.title}
                    </Text>
                    {ev.time && (
                      <Text style={[styles.blockTime, { fontFamily: theme.fMono, color: theme.accent + 'bb' }]}>
                        {fmt12h(ev.time)}{ev.endTime ? ` – ${fmt12h(ev.endTime)}` : ''}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}

              {dayHomework.length > 0 && (
                <View style={[styles.hwRow, { left: GUTTER + 6, top: 6 }]}>
                  {dayHomework.map((hw) => {
                    const color = hw.classColor ?? theme.accent;
                    return (
                      <View key={hw.id} style={[styles.hwChip, { backgroundColor: color + '22', borderColor: color + '66' }]}>
                        <Text style={[styles.hwChipText, { fontFamily: theme.fMono, color }]} numberOfLines={1}>{hw.title}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}

      <AddEventSheet visible={!!addEventDate} onClose={() => setAddEventDate(null)} defaultDate={addEventDate ?? undefined} defaultTime={addEventTime} />

      {/* Class detail */}
      <Modal visible={!!selectedClass} transparent animationType="fade" onRequestClose={() => setSelectedClass(null)}>
        <TouchableOpacity style={detailStyles.backdrop} activeOpacity={1} onPress={() => setSelectedClass(null)}>
          <View style={[detailStyles.card, { backgroundColor: theme.bg, borderColor: selectedClass?.color ?? theme.line }]} onStartShouldSetResponder={() => true}>
            <View style={[detailStyles.colorBar, { backgroundColor: selectedClass?.color }]} />
            <View style={detailStyles.body}>
              <Text style={[detailStyles.cardTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
                {selectedClass?.emoji ?? '📚'}  {selectedClass?.name}
              </Text>
              {selectedClass?.teacher && <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: theme.soft }]}>{selectedClass.teacher}</Text>}
              {selectedClass?.start && <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: selectedClass.color }]}>{selectedClass.start} – {selectedClass.end}</Text>}
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
          <View style={[detailStyles.card, { backgroundColor: theme.bg, borderColor: theme.accent }]} onStartShouldSetResponder={() => true}>
            <View style={[detailStyles.colorBar, { backgroundColor: theme.accent }]} />
            <View style={detailStyles.body}>
              <Text style={[detailStyles.cardTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{selectedEvent?.title}</Text>
              {selectedEvent?.time && <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: theme.accent }]}>{selectedEvent.time}{selectedEvent.endTime ? ` – ${selectedEvent.endTime}` : ''}</Text>}
              {selectedEvent?.date && <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: theme.soft }]}>{new Date(selectedEvent.date).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>}
              {selectedEvent?.location && <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: theme.soft }]}>📍 {selectedEvent.location}</Text>}
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

const mStyles = StyleSheet.create({
  weekRow: { flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 4 },
  weekCell: { flex: 1, alignItems: 'center' },
  weekLabel: { fontSize: 10, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4 },
  cell: { width: '14.285%', minHeight: 70, padding: 3, borderRadius: 12, alignItems: 'center' },
  dayCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  dayNum: { fontSize: 13 },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  holidayLabel: { fontSize: 7, letterSpacing: 0.3, textAlign: 'center', marginTop: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { fontSize: 10, letterSpacing: 0.5 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerLeft: { gap: 2 },
  title: { fontSize: 28 },
  monthLabel: { fontSize: 10, letterSpacing: 1.5 },
  navRow: { flexDirection: 'row', gap: 4, paddingBottom: 4, alignItems: 'center' },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 18 },
  toggleViewBtn: { marginLeft: 4, width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  toggleViewText: { fontSize: 16 },
  dayStrip: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 10, paddingTop: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  dayPill: { flex: 1, alignItems: 'center', gap: 4 },
  dayAbbr: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
  dayNumWrap: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  dayNum: { fontSize: 15 },
  gridScroll: { flex: 1 },
  hourRow: { position: 'absolute', left: 0, right: 0, height: ROW_H, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-start', paddingTop: 4 },
  timeLabel: { fontSize: 10, letterSpacing: 0.3, textAlign: 'right', paddingRight: 10 },
  hourLine: { flex: 1, height: StyleSheet.hairlineWidth, marginTop: 7 },
  block: { position: 'absolute', borderRadius: 28, borderLeftWidth: 3, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden', gap: 2 },
  blockTitle: { fontSize: 12, letterSpacing: 0.2 },
  blockTime: { fontSize: 10, letterSpacing: 0.2 },
  closedBanner: { position: 'absolute', top: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', gap: 8 },
  closedPill: { borderRadius: 32, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  closedLabel: { fontSize: 12, letterSpacing: 2 },
  closedSub: { fontSize: 10, letterSpacing: 1 },
  closedDot: { width: 5, height: 5, borderRadius: 3 },
  hwRow: { position: 'absolute', right: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  hwChip: { borderRadius: 32, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  hwChipText: { fontSize: 10, letterSpacing: 0.2 },
});
