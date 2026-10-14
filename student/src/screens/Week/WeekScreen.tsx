import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { getClosedReason, closedDaysInMonth, getDaySchedule, hasSchoolCalendar } from '../../data/schoolCalendars';
import { Class, CalEvent, Homework } from '../../types';
import { parseTime, fmt12, isSameDay, dateKey, startOfDay } from '../../lib/time';
import { eventIcon } from '../../data/constants';
import { classesOnDate } from '../../lib/timetable';
import { eventsOn } from '../../lib/events';
import AddEventSheet from '../sheets/AddEventSheet';
import AddHomeworkSheet from '../sheets/AddHomeworkSheet';
import EventDetailSheet from '../sheets/EventDetailSheet';
import HomeworkDetailSheet from '../sheets/HomeworkDetailSheet';
import { SyncBanner } from '../../components/SaveStatus';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ABBR_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const START_HOUR = 8;
const END_HOUR = 21;
const ROW_H = 64;
const GUTTER = 52;
const yFor = (min: number) => ((min - START_HOUR * 60) / 60) * ROW_H;

function getWeekDays(anchor: Date): Date[] {
  const monday = new Date(anchor);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells: (Date | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function closedColor(label: string): string {
  if (/break/i.test(label)) return '#06d6e0';
  if (/pro-d|turnaround|curriculum/i.test(label)) return '#f59e0b';
  return '#f87171';
}

export default function WeekScreen() {
  const today = new Date();
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [anchor, setAnchor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(today);
  const [monthAnchor, setMonthAnchor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [addEventTime, setAddEventTime] = useState('');
  const [evEdit, setEvEdit] = useState<CalEvent | null>(null);
  const [hwEdit, setHwEdit] = useState<Homework | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [evPick, setEvPick] = useState<{ id: string; occ?: string } | null>(null);
  const [hwDetailId, setHwDetailId] = useState<string | null>(null);

  const homework = useStore((s) => s.homework);
  const classes = useStore((s) => s.classes);
  const timetable = useStore((s) => s.timetable);
  const events = useStore((s) => s.events);
  const school = useStore((s) => s.school);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const bgImageUri = useStore((s) => s.bgImageUri);
  const theme = makeTheme(vibe, darkMode);
  const hasBg = bgImageUri !== '';
  const cardSurface = hasBg ? 'rgba(20,20,20,0.82)' : theme.surface;

  const weekDays = getWeekDays(anchor);
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
  const gridH = hours.length * ROW_H;

  const isWeekend = selectedDay.getDay() === 0 || selectedDay.getDay() === 6;
  const closedReason = !isWeekend ? getClosedReason(selectedDay, school.name) : null;
  const schedule = getDaySchedule(selectedDay, school.name);

  const dayClasses = isWeekend || closedReason ? [] : classesOnDate(selectedDay, classes, timetable, school.name);
  const dayEvents = eventsOn(events, selectedDay);
  const dayHomework = homework.filter((h) => h.dueDate && isSameDay(new Date(h.dueDate), selectedDay));

  const sod = startOfDay(selectedDay);
  const overdueHw = homework.filter((h) => !h.done && h.dueDate && new Date(h.dueDate) < sod);
  const weekOut = new Date(sod); weekOut.setDate(sod.getDate() + 8);
  const upcomingHw = homework
    .filter((h) => !h.done && h.dueDate && new Date(h.dueDate) >= sod && new Date(h.dueDate) < weekOut)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const monthLabel = (viewMode === 'month'
    ? new Date(monthAnchor.year, monthAnchor.month, 1)
    : selectedDay
  ).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  function shiftWeek(n: number) {
    const d = new Date(anchor); d.setDate(d.getDate() + 7 * n); setAnchor(d);
    const sel = new Date(selectedDay); sel.setDate(sel.getDate() + 7 * n); setSelectedDay(sel);
  }
  function shiftMonth(n: number) {
    setMonthAnchor((p) => { const d = new Date(p.year, p.month + n, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  }

  const nowMin = today.getHours() * 60 + today.getMinutes();
  const showNow = isSameDay(selectedDay, today) && nowMin >= START_HOUR * 60 && nowMin < END_HOUR * 60;
  const evBase = events.find((e) => e.id === evPick?.id);
  const evDetail = evBase ? { ...evBase, occurrence: evPick?.occ } : null;
  const hwDetail = homework.find((h) => h.id === hwDetailId) ?? null;

  // ─── Month view ────────────────────────────────────────────────────────────
  const renderMonth = () => {
    const monthDays = getMonthDays(monthAnchor.year, monthAnchor.month);
    const closed = closedDaysInMonth(monthAnchor.year, monthAnchor.month, school.name);
    return (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={mStyles.weekRow}>
          {DAY_ABBR_SHORT.map((d, i) => (
            <View key={i} style={mStyles.weekCell}><Text style={[mStyles.weekLabel, { fontFamily: theme.fMono, color: theme.soft }]}>{d}</Text></View>
          ))}
        </View>
        <View style={mStyles.grid}>
          {monthDays.map((day, i) => {
            if (!day) return <View key={`empty-${i}`} style={mStyles.cell} />;
            const key = dateKey(day);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDay);
            const isOff = day.getDay() === 0 || day.getDay() === 6;
            const closedLabel = isOff ? undefined : closed.get(key);
            const dotColor = closedLabel ? closedColor(closedLabel) : null;
            const hasPersonal = eventsOn(events, day).length > 0
              || homework.some((h) => h.dueDate && !h.done && isSameDay(new Date(h.dueDate), day));
            return (
              <TouchableOpacity
                key={key}
                style={[mStyles.cell, dotColor && { backgroundColor: dotColor + '18' }]}
                onPress={() => { setSelectedDay(day); setAnchor(day); setViewMode('day'); }}
                activeOpacity={0.7}
                accessibilityLabel={`${day.toDateString()}${closedLabel ? `, ${closedLabel}` : ''}`}
              >
                <View style={[mStyles.dayCircle, isSelected && { backgroundColor: theme.accent }, isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.accent }]}>
                  <Text style={[mStyles.dayNum, {
                    fontFamily: isToday || isSelected ? theme.fBodySemiBold : theme.fBody,
                    color: isSelected ? '#fff' : isOff ? theme.soft : theme.ink, opacity: isOff ? 0.5 : 1,
                  }]}>{day.getDate()}</Text>
                </View>
                <View style={mStyles.dotRow}>
                  {dotColor && <View style={[mStyles.dot, { backgroundColor: dotColor }]} />}
                  {hasPersonal && <View style={[mStyles.dot, { backgroundColor: theme.accent }]} />}
                </View>
                {closedLabel && <Text style={[mStyles.holidayLabel, { fontFamily: theme.fMono, color: dotColor! }]} numberOfLines={2}>{closedLabel}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[mStyles.legend, { borderTopColor: theme.line }]}>
          {[
            { color: '#f87171', label: 'Holiday' },
            { color: '#f59e0b', label: 'Pro-D Day' },
            { color: '#06d6e0', label: 'Break' },
            { color: theme.accent, label: 'Homework or plans' },
          ].map((item) => (
            <View key={item.label} style={mStyles.legendItem}>
              <View style={[mStyles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[mStyles.legendLabel, { fontFamily: theme.fMono, color: theme.soft }]}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Text style={[mStyles.source, { fontFamily: theme.fMono, color: theme.soft }]}>
          {hasSchoolCalendar(school.name) ? `${school.name} 2026–27 calendar` : 'BC statutory holidays. Your school’s Pro-D days aren’t loaded yet.'}
        </Text>
      </ScrollView>
    );
  };

  // ─── Bell-schedule overlay for the day grid ────────────────────────────────
  const renderBells = () => {
    if (!schedule) return null;
    const startMin = parseTime(schedule.dayStart)!;
    const endMin = parseTime(schedule.dayEnd)!;
    const items: React.ReactNode[] = [];
    // Passing breaks between back-to-back class periods
    const classPeriods = schedule.periods.filter((p) => p.kind === 'class' || p.kind === 'lunch');
    for (let i = 0; i < classPeriods.length - 1; i++) {
      const gapStart = parseTime(classPeriods[i].end)!;
      const gapEnd = parseTime(classPeriods[i + 1].start)!;
      if (gapEnd - gapStart >= 5) {
        items.push(
          <View key={`gap${i}`} pointerEvents="none" style={[styles.gapBand, { top: yFor(gapStart), height: Math.max(yFor(gapEnd) - yFor(gapStart), 4), backgroundColor: theme.ink + '10' }]}>
            <Text style={[styles.gapLabel, { fontFamily: theme.fMono, color: theme.soft }]}>break {gapEnd - gapStart} min</Text>
          </View>
        );
      }
    }
    schedule.periods.forEach((p, i) => {
      const s = parseTime(p.start)!; const e = parseTime(p.end)!;
      if (p.kind === 'lunch' || p.kind === 'tutorial' || p.kind === 'break') {
        const color = p.kind === 'lunch' ? theme.amber : theme.soft;
        items.push(
          <View key={`p${i}`} pointerEvents="none" style={[styles.bellBand, { top: yFor(s), height: yFor(e) - yFor(s), borderColor: color + '88', backgroundColor: color + (p.kind === 'lunch' ? '30' : '14') }]}>
            <Text style={[styles.bellBandLabel, { fontFamily: theme.fMono, color }]}>
              {p.kind === 'lunch' ? '🥪 LUNCH' : p.label.toUpperCase()} {fmt12(p.start)}–{fmt12(p.end)}
            </Text>
          </View>
        );
      }
    });
    const marker = (min: number, label: string, key: string) => (
      <View key={key} pointerEvents="none" style={[styles.marker, { top: yFor(min) - 1 }]}>
        <View style={[styles.markerLine, { backgroundColor: theme.mint }]} />
        <Text style={[styles.markerLabel, { fontFamily: theme.fMono, color: theme.mint, backgroundColor: theme.bg }]}>{label}</Text>
      </View>
    );
    items.push(marker(startMin, `🔔 SCHOOL STARTS ${fmt12(schedule.dayStart)}`, 'start'));
    items.push(marker(endMin, `🔔 DISMISSAL ${fmt12(schedule.dayEnd)}`, 'end'));
    return items;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: hasBg ? 'transparent' : theme.bg }]} edges={['top']}>
      {!hasBg && <LinearGradient colors={[theme.accent + '38', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.65 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
      {hasBg && (
        <ImageBackground source={{ uri: bgImageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover">
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />
        </ImageBackground>
      )}

      <SyncBanner />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{viewMode === 'month' ? 'month.' : 'week.'}</Text>
          <Text style={[styles.monthLabel, { fontFamily: theme.fMono, color: theme.sub }]}>{monthLabel.toUpperCase()}</Text>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => (viewMode === 'day' ? shiftWeek(-1) : shiftMonth(-1))} style={styles.navBtn} accessibilityLabel={viewMode === 'day' ? 'Previous week' : 'Previous month'}>
            <Text style={[styles.navArrow, { color: theme.accent }]}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => (viewMode === 'day' ? shiftWeek(1) : shiftMonth(1))} style={styles.navBtn} accessibilityLabel={viewMode === 'day' ? 'Next week' : 'Next month'}>
            <Text style={[styles.navArrow, { color: theme.accent }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.accent }]}
            onPress={() => { setAddEventTime(''); setAddEventDate(selectedDay); }}
            accessibilityLabel={`Add a plan on ${selectedDay.toDateString()}`}
          >
            <Text style={[styles.addBtnText, { fontFamily: theme.fMono }]}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleViewBtn, { backgroundColor: cardSurface, borderColor: theme.line }]}
            onPress={() => {
              if (viewMode === 'day') { setMonthAnchor({ year: selectedDay.getFullYear(), month: selectedDay.getMonth() }); setViewMode('month'); }
              else setViewMode('day');
            }}
            accessibilityLabel={viewMode === 'day' ? 'Show month' : 'Show week'}
          >
            <Text style={[styles.toggleViewText, { fontFamily: theme.fMono, color: theme.accent }]}>{viewMode === 'day' ? 'Month' : 'Week'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'month' ? renderMonth() : (
        <>
          <View style={[styles.dayStrip, { borderBottomColor: theme.line }]}>
            {weekDays.map((day) => {
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDay);
              const isOff = day.getDay() === 0 || day.getDay() === 6;
              const closed = !isOff ? getClosedReason(day, school.name) : null;
              return (
                <TouchableOpacity key={day.toISOString()} style={styles.dayPill} onPress={() => setSelectedDay(day)} activeOpacity={0.7}>
                  <Text style={[styles.dayAbbr, { fontFamily: theme.fMono, color: isSelected ? theme.accent : isOff ? theme.soft : theme.sub }]}>{DAY_ABBR[day.getDay()]}</Text>
                  <View style={[styles.dayNumWrap, isSelected && { backgroundColor: theme.accent }, isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.accent }]}>
                    <Text style={[styles.dayNum, { fontFamily: isToday || isSelected ? theme.fBodySemiBold : theme.fBody, color: isSelected ? '#fff' : isToday ? theme.accent : isOff ? theme.soft : theme.ink }]}>{day.getDate()}</Text>
                  </View>
                  {closed ? <View style={[styles.closedDot, { backgroundColor: closedColor(closed) }]} /> : <View style={styles.closedDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {isWeekend ? (
            <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.weekendContent}>
              <Text style={[styles.weekendTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{selectedDay.getDay() === 6 ? 'Saturday.' : 'Sunday.'}</Text>
              <Text style={[styles.weekendSub, { fontFamily: theme.fMono, color: theme.soft }]}>No school — catch up or get ahead.</Text>

              {dayEvents.length > 0 && (
                <View style={styles.wkSection}>
                  <Text style={[styles.wkSectionLabel, { fontFamily: theme.fMono, color: theme.accent }]}>PLANS</Text>
                  {dayEvents.map((ev) => (
                    <TouchableOpacity key={ev.id} onPress={() => setEvPick({ id: ev.id, occ: ev.occurrence })} style={[styles.wkItem, { borderLeftColor: theme.accent, backgroundColor: cardSurface }]}>
                      <Text style={[styles.wkItemTitle, { fontFamily: theme.fBody, color: theme.ink }]}>{ev.icon ?? eventIcon(ev.type)} {ev.title}</Text>
                      {ev.time && <Text style={[styles.wkItemSub, { fontFamily: theme.fMono, color: theme.accent }]}>{fmt12(ev.time)}{ev.endTime ? ` – ${fmt12(ev.endTime)}` : ''}</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {overdueHw.length > 0 && (
                <View style={styles.wkSection}>
                  <Text style={[styles.wkSectionLabel, { fontFamily: theme.fMono, color: theme.red }]}>⚠ OVERDUE</Text>
                  {overdueHw.map((hw) => (
                    <TouchableOpacity key={hw.id} onPress={() => setHwDetailId(hw.id)} style={[styles.wkItem, { borderLeftColor: theme.red, backgroundColor: cardSurface }]}>
                      <Text style={[styles.wkItemTitle, { fontFamily: theme.fBodyMedium, color: theme.red }]}>⚠ {hw.title}</Text>
                      {hw.subject && <Text style={[styles.wkItemSub, { fontFamily: theme.fMono, color: theme.red }]}>{hw.subject}</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {upcomingHw.length > 0 && (
                <View style={styles.wkSection}>
                  <Text style={[styles.wkSectionLabel, { fontFamily: theme.fMono, color: theme.accent }]}>COMING UP</Text>
                  {upcomingHw.map((hw) => {
                    const due = new Date(hw.dueDate!);
                    const tom = new Date(startOfDay(today)); tom.setDate(tom.getDate() + 1);
                    const isTom = isSameDay(due, tom);
                    const c = isTom ? theme.amber : hw.classColor ?? theme.accent;
                    return (
                      <TouchableOpacity key={hw.id} onPress={() => setHwDetailId(hw.id)} style={[styles.wkItem, { borderLeftColor: c, backgroundColor: cardSurface }]}>
                        <View style={styles.wkItemTop}>
                          <Text style={[styles.wkItemTitle, { fontFamily: isTom ? theme.fBodyMedium : theme.fBody, color: isTom ? theme.amber : theme.ink }]}>{hw.title}</Text>
                          <Text style={[styles.wkItemBadge, { fontFamily: theme.fMono, color: c, backgroundColor: c + '20' }]}>
                            {isTom ? 'Tomorrow' : due.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                        {hw.subject && <Text style={[styles.wkItemSub, { fontFamily: theme.fMono, color: c }]}>{hw.subject}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {overdueHw.length === 0 && upcomingHw.length === 0 && dayEvents.length === 0 && (
                <View style={styles.wkEmpty}>
                  <Text style={styles.wkEmptyIcon}>🎉</Text>
                  <Text style={[styles.wkEmptyText, { fontFamily: theme.fBody, color: theme.soft }]}>All clear — nothing overdue and nothing due this week.</Text>
                </View>
              )}
              <TouchableOpacity style={[styles.addPlan, { borderColor: theme.line }]} onPress={() => { setAddEventTime(''); setAddEventDate(selectedDay); }}>
                <Text style={[styles.addPlanText, { fontFamily: theme.fMono, color: theme.accent }]}>+ Add a plan for this day</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
              {(schedule?.note || closedReason) && (
                <Text style={[styles.dayNote, { fontFamily: theme.fMono, color: closedReason ? closedColor(closedReason) : theme.amber }]}>
                  {closedReason ? `${closedReason} — no school` : schedule!.note}
                </Text>
              )}
              {dayHomework.length > 0 && (
                <View style={[styles.hwRow, { paddingLeft: GUTTER + 6 }]}>
                  <Text style={[styles.hwRowLabel, { fontFamily: theme.fMono, color: theme.soft }]}>DUE</Text>
                  {dayHomework.map((hw) => {
                    const color = hw.classColor ?? theme.accent;
                    return (
                      <TouchableOpacity key={hw.id} onPress={() => setHwDetailId(hw.id)} style={[styles.hwChip, { backgroundColor: color + '22', borderColor: color + '66' }]}>
                        <Text style={[styles.hwChipText, { fontFamily: theme.fMono, color, textDecorationLine: hw.done ? 'line-through' : 'none' }]} numberOfLines={1}>
                          {hw.done ? '✓ ' : ''}{hw.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <View style={{ height: gridH, position: 'relative' }}>
                {hours.map((hour, i) => (
                  <TouchableOpacity
                    key={hour}
                    style={[styles.hourRow, { top: i * ROW_H, borderTopColor: theme.line }]}
                    onPress={() => { setAddEventTime(`${hour}:00`); setAddEventDate(selectedDay); }}
                    activeOpacity={0.4}
                    accessibilityLabel={`Add a plan at ${fmt12(hour * 60)}`}
                  >
                    <Text style={[styles.timeLabel, { fontFamily: theme.fMono, color: theme.soft, width: GUTTER }]}>{fmt12(hour * 60)}</Text>
                    <View style={[styles.hourLine, { backgroundColor: theme.line }]} />
                  </TouchableOpacity>
                ))}

                {closedReason && (
                  <View pointerEvents="none" style={[styles.closedBanner, { left: GUTTER, top: yFor(9 * 60), height: ROW_H * 6, backgroundColor: closedColor(closedReason) + '14', borderColor: closedColor(closedReason) + '55' }]}>
                    <Text style={[styles.closedLabel, { fontFamily: theme.fMono, color: closedColor(closedReason) }]}>{closedReason.toUpperCase()}</Text>
                    <Text style={[styles.closedSub, { fontFamily: theme.fMono, color: theme.soft }]}>No school</Text>
                  </View>
                )}

                {dayClasses.map(({ cls, start, end, slotLabel }, idx) => {
                  const s = parseTime(start)!; const e = parseTime(end)!;
                  return (
                    <TouchableOpacity
                      key={`${cls.id}-${idx}`}
                      style={[styles.block, { top: yFor(s), left: GUTTER + 6, right: 6, height: Math.max(yFor(e) - yFor(s) - 2, 30), backgroundColor: cls.color + '22', borderLeftColor: cls.color }]}
                      onPress={() => setSelectedClass(cls)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.blockTitle, { fontFamily: theme.fMono, color: cls.color }]} numberOfLines={1}>{cls.emoji ? `${cls.emoji} ` : ''}{cls.name}</Text>
                      <Text style={[styles.blockTime, { fontFamily: theme.fMono, color: cls.color + 'cc' }]}>{fmt12(start)} – {fmt12(end)}{slotLabel ? `  ·  ${slotLabel}` : ''}</Text>
                    </TouchableOpacity>
                  );
                })}

                {renderBells()}

                {dayEvents.map((ev) => {
                  const s = parseTime(ev.time);
                  if (s === null || s < START_HOUR * 60 || s >= END_HOUR * 60) return null;
                  const e = parseTime(ev.endTime) ?? s + 60;
                  return (
                    <TouchableOpacity
                      key={ev.id}
                      style={[styles.block, { top: yFor(s), left: GUTTER + 30, right: 6, height: Math.max(yFor(e) - yFor(s) - 2, 30), backgroundColor: theme.accent + '33', borderLeftColor: theme.accent, zIndex: 3 }]}
                      onPress={() => setEvPick({ id: ev.id, occ: ev.occurrence })}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.blockTitle, { fontFamily: theme.fMono, color: theme.accent }]} numberOfLines={1}>{ev.icon ?? eventIcon(ev.type)} {ev.title}</Text>
                      <Text style={[styles.blockTime, { fontFamily: theme.fMono, color: theme.accent + 'cc' }]}>{fmt12(ev.time)}{ev.endTime ? ` – ${fmt12(ev.endTime)}` : ''}</Text>
                    </TouchableOpacity>
                  );
                })}

                {showNow && (
                  <View pointerEvents="none" style={[styles.nowLine, { top: yFor(nowMin), left: GUTTER - 4 }]}>
                    <View style={[styles.nowDot, { backgroundColor: theme.red }]} />
                    <View style={[styles.nowBar, { backgroundColor: theme.red }]} />
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </>
      )}

      <AddEventSheet
        visible={!!addEventDate || !!evEdit}
        onClose={() => { setAddEventDate(null); setEvEdit(null); }}
        defaultDate={addEventDate ?? undefined}
        defaultTime={addEventTime || undefined}
        editEvent={evEdit}
      />
      <AddHomeworkSheet visible={!!hwEdit} onClose={() => setHwEdit(null)} editHw={hwEdit} />
      <EventDetailSheet ev={evDetail} visible={!!evDetail} onClose={() => setEvPick(null)} onEdit={(ev) => setEvEdit(ev)} />
      <HomeworkDetailSheet hw={hwDetail} visible={!!hwDetail} onClose={() => setHwDetailId(null)} onEdit={(hw) => setHwEdit(hw)} />

      <Modal visible={!!selectedClass} transparent animationType="fade" onRequestClose={() => setSelectedClass(null)}>
        <TouchableOpacity style={detailStyles.backdrop} activeOpacity={1} onPress={() => setSelectedClass(null)}>
          <View style={[detailStyles.card, { backgroundColor: theme.surface, borderColor: selectedClass?.color ?? theme.line }]} onStartShouldSetResponder={() => true}>
            <View style={[detailStyles.colorBar, { backgroundColor: selectedClass?.color }]} />
            <View style={detailStyles.body}>
              <Text style={[detailStyles.cardTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>{selectedClass?.emoji ?? '📚'}  {selectedClass?.name}</Text>
              {!!selectedClass?.teacher && <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: theme.soft }]}>{selectedClass.teacher}</Text>}
              {selectedClass && (() => {
                const when = dayClasses.filter((d) => d.cls.id === selectedClass.id).map((d) => `${fmt12(d.start)} – ${fmt12(d.end)}`).join(', ');
                return when ? <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: selectedClass.color }]}>{when}</Text> : null;
              })()}
              <Text style={[detailStyles.cardMeta, { fontFamily: theme.fMono, color: theme.soft }]}>
                {homework.filter((h) => h.classId === selectedClass?.id && !h.done).length} open assignments
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedClass(null)} accessibilityLabel="Close">
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
  card: { borderRadius: 28, borderWidth: 1, flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden', maxWidth: 520, width: '100%', alignSelf: 'center' },
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
  cell: { width: '14.285%', minHeight: 72, padding: 3, borderRadius: 12, alignItems: 'center' },
  dayCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  dayNum: { fontSize: 13 },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 2, height: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  holidayLabel: { fontSize: 7, letterSpacing: 0.2, textAlign: 'center', marginTop: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { fontSize: 10, letterSpacing: 0.5 },
  source: { fontSize: 9, letterSpacing: 0.3, paddingHorizontal: 16, paddingTop: 10 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerLeft: { gap: 2 },
  title: { fontSize: 36 },
  monthLabel: { fontSize: 10, letterSpacing: 1.5 },
  navRow: { flexDirection: 'row', gap: 4, paddingBottom: 4, alignItems: 'center' },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 18 },
  toggleViewBtn: { marginLeft: 4, height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  toggleViewText: { fontSize: 12 },
  addBtn: { marginLeft: 4, height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 12 },
  dayStrip: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 10, paddingTop: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  dayPill: { flex: 1, alignItems: 'center', gap: 4 },
  dayAbbr: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
  dayNumWrap: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  dayNum: { fontSize: 15 },
  closedDot: { width: 5, height: 5, borderRadius: 3 },
  gridScroll: { flex: 1 },
  dayNote: { fontSize: 11, letterSpacing: 0.3, paddingHorizontal: 16, paddingTop: 8 },
  hwRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingRight: 8, paddingTop: 8, paddingBottom: 4, alignItems: 'center' },
  hwRowLabel: { fontSize: 9, letterSpacing: 1, marginRight: 2 },
  hwChip: { borderRadius: 32, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 220 },
  hwChipText: { fontSize: 10, letterSpacing: 0.2 },
  hourRow: { position: 'absolute', left: 0, right: 0, height: ROW_H, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-start', paddingTop: 4 },
  timeLabel: { fontSize: 10, letterSpacing: 0.3, textAlign: 'right', paddingRight: 8 },
  hourLine: { flex: 1, height: StyleSheet.hairlineWidth, marginTop: 7 },
  block: { position: 'absolute', borderRadius: 12, borderLeftWidth: 3, paddingHorizontal: 10, paddingVertical: 6, gap: 2, overflow: 'hidden' },
  blockTitle: { fontSize: 12, letterSpacing: 0.2, fontWeight: '700' },
  blockTime: { fontSize: 10, letterSpacing: 0.2 },
  bellBand: { position: 'absolute', left: GUTTER + 6, right: 6, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, zIndex: 2, justifyContent: 'center', paddingHorizontal: 8 },
  bellBandLabel: { fontSize: 9, letterSpacing: 0.8, textAlign: 'right' },
  gapBand: { position: 'absolute', left: GUTTER + 6, right: 6, zIndex: 1, justifyContent: 'center' },
  gapLabel: { fontSize: 8, letterSpacing: 0.5, textAlign: 'right', paddingRight: 8 },
  marker: { position: 'absolute', left: GUTTER, right: 0, zIndex: 4, flexDirection: 'row', alignItems: 'center' },
  markerLine: { position: 'absolute', left: 0, right: 0, height: 2 },
  markerLabel: { fontSize: 9, letterSpacing: 0.8, marginLeft: 'auto', marginRight: 8, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  closedBanner: { position: 'absolute', right: 6, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 6, zIndex: 2 },
  closedLabel: { fontSize: 12, letterSpacing: 2 },
  closedSub: { fontSize: 10, letterSpacing: 1 },
  nowLine: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 6 },
  nowDot: { width: 8, height: 8, borderRadius: 4 },
  nowBar: { flex: 1, height: 2 },
  weekendContent: { padding: 20, gap: 8, paddingBottom: 110 },
  weekendTitle: { fontSize: 32, marginBottom: 2 },
  weekendSub: { fontSize: 11, letterSpacing: 0.5, marginBottom: 8 },
  wkSection: { gap: 8, marginTop: 16 },
  wkSectionLabel: { fontSize: 10, letterSpacing: 1.2 },
  wkItem: { borderLeftWidth: 3, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  wkItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  wkItemTitle: { fontSize: 15, flex: 1, lineHeight: 20 },
  wkItemBadge: { fontSize: 10, letterSpacing: 0.3, borderRadius: 32, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  wkItemSub: { fontSize: 11, letterSpacing: 0.3 },
  wkEmpty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  wkEmptyIcon: { fontSize: 40 },
  wkEmptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  addPlan: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 16 },
  addPlanText: { fontSize: 12, letterSpacing: 0.5 },
});
