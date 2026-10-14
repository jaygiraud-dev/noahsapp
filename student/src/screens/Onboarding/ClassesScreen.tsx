import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, GRADES } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { Class, Period, Timetable } from '../../types';
import { CLASS_COLORS } from '../../data/constants';
import { hasSchoolCalendar } from '../../data/schoolCalendars';
import { defaultPeriods, resizeDays, sameOrderDays } from '../../lib/timetable';
import { normalizeTime, fmt12, parseTime } from '../../lib/time';
import MicroLabel from '../../components/MicroLabel';
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';

const EMOJIS = ['📖', '🧭', '🧪', '🌎', '🏐', '🎨', '🎵', '💻', '🔧', '🗣️'];

function exampleNames(g: number): string[] {
  const math = g >= 11 ? `Pre-Calc ${g}` : `Math ${g}`;
  const science = g === 11 ? 'Chemistry 11' : g === 12 ? 'Physics 12' : `Science ${g}`;
  return [`English ${g}`, math, science, `Socials ${g}`, `PE ${g}`, `French ${g}`, 'Metalwork', 'ICT'];
}

function blankClass(i: number, slots: number): Class {
  return { id: 'c' + Date.now() + i, name: '', teacher: '', color: CLASS_COLORS[i % CLASS_COLORS.length], emoji: EMOJIS[i % EMOJIS.length], slot: i < slots ? i : null };
}

const display = (p: Period): Period => ({ ...p, start: p.start ? fmt12(p.start) : '', end: p.end ? fmt12(p.end) : '' });

/** "Step 2: Your classes" — grade, classes per day, slot times, class names. */
export default function ClassesScreen({ navigation }: any) {
  const store = useStore();
  const theme = makeTheme(store.vibe, store.darkMode);
  const school = store.school;
  const knownBells = hasSchoolCalendar(school.name);

  const [periods, setPeriods] = useState<Period[]>(
    store.timetable?.periods?.length ? store.timetable.periods.map(display) : defaultPeriods(4, school.name).map(display)
  );
  const [classes, setClasses] = useState<Class[]>(
    store.classes.length > 0
      ? store.classes.map((c, i) => ({ ...c, slot: c.slot !== undefined ? c.slot : i < periods.length ? i : null }))
      : Array.from({ length: periods.length }, (_, i) => blankClass(i, periods.length))
  );
  const [showErrors, setShowErrors] = useState(false);
  const [slotsChanged, setSlotsChanged] = useState(false);
  const examples = exampleNames(store.grade);

  function setCount(n: number) {
    setPeriods((prev) => (n <= prev.length ? prev.slice(0, n) : [...prev, ...defaultPeriods(n, school.name).slice(prev.length).map(display)]));
    // Make sure there are at least as many class name boxes as slots
    setClasses((prev) => {
      const fitted = prev.map((c) => (c.slot != null && c.slot >= n ? { ...c, slot: null } : c));
      return fitted.length >= n ? fitted : [...fitted, ...Array.from({ length: n - fitted.length }, (_, i) => blankClass(fitted.length + i, n))];
    });
    setSlotsChanged(true);
  }

  const updatePeriod = (i: number, patch: Partial<Period>) => setPeriods((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const updateClass = (id: string, patch: Partial<Class>) => setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const periodError = (p: Period) => {
    const s = parseTime(p.start); const e = parseTime(p.end);
    if (s === null || e === null) return 'Add a start and end time, like 9:15 or 1:45 pm.';
    if (e <= s) return 'The end time needs to be after the start time.';
    return '';
  };
  const named = classes.filter((c) => c.name.trim());
  const anyPeriodError = periods.some((p) => periodError(p) !== '');

  function handleNext() {
    if (named.length === 0 || anyPeriodError) { setShowErrors(true); return; }
    const cleanPeriods = periods.map((p) => ({ ...p, label: p.label.trim() || 'Class', start: normalizeTime(p.start)!, end: normalizeTime(p.end)! }));
    const cleanClasses = named.map((c) => ({ ...c, name: c.name.trim(), start: undefined, end: undefined }));
    const prev = store.timetable;
    const keepIds = new Set(cleanClasses.map((c) => c.id));
    let days: Timetable['days'];
    if (prev && prev.periods.length && !slotsChanged) {
      // Keep the existing week, clear deleted classes, fit it to the new number of slots
      const scrubbed = Object.fromEntries(
        Object.entries(prev.days).map(([k, row]) => [k, row.map((id) => (id && keepIds.has(id) ? id : null))])
      ) as Timetable['days'];
      days = resizeDays(scrubbed, cleanPeriods.length, cleanClasses);
    } else {
      days = sameOrderDays(cleanPeriods, cleanClasses);
    }
    store.setSchedule(cleanClasses, { periods: cleanPeriods, sameEveryDay: prev?.sameEveryDay ?? true, days });
    navigation.navigate('Timetable');
  }

  const timeInput = (bad: boolean) => [styles.timeInput, { fontFamily: theme.fMono, color: theme.ink, backgroundColor: theme.surfaceHi, borderColor: bad ? theme.red : theme.line }];
  const pillStyle = (active: boolean) => [styles.pill, { backgroundColor: active ? theme.accent : theme.surface, borderColor: active ? theme.accent : theme.line }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.back, { fontFamily: theme.fMono, color: theme.accent }]}>← back</Text>
          </TouchableOpacity>
        )}
        <MicroLabel color={theme.accent}>{store.onboarded ? 'Edit schedule' : 'Step 2 of 4'}</MicroLabel>
        <SerifTitle size={30}>Your classes.</SerifTitle>

        <View style={styles.block}>
          <Text style={[styles.q, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>What grade are you in?</Text>
          <View style={styles.row}>
            {GRADES.map((g) => (
              <TouchableOpacity key={g} style={pillStyle(g === store.grade)} onPress={() => store.setGrade(g)} accessibilityLabel={`Grade ${g}`} accessibilityState={{ selected: g === store.grade }}>
                <Text style={[styles.pillText, { fontFamily: theme.fBodySemiBold, color: g === store.grade ? '#fff' : theme.ink }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={[styles.q, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>How many classes do you have each day?</Text>
          <View style={styles.row}>
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <TouchableOpacity key={n} style={pillStyle(n === periods.length)} onPress={() => setCount(n)} accessibilityLabel={`${n} classes a day`} accessibilityState={{ selected: n === periods.length }}>
                <Text style={[styles.pillText, { fontFamily: theme.fBodySemiBold, color: n === periods.length ? '#fff' : theme.ink }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.help, { fontFamily: theme.fBody, color: theme.sub }]}>
            {knownBells
              ? `These times come from ${school.name}’s bell schedule. Late-start and early-dismissal days adjust on their own.`
              : 'When does each one start and end? Type times like 9:15 or 1:45 pm.'}
          </Text>
          {periods.map((p, i) => {
            const err = showErrors ? periodError(p) : '';
            return (
              <View key={p.id} style={[styles.periodCard, { backgroundColor: theme.surface, borderColor: err ? theme.red : theme.line }]}>
                <TextInput
                  style={[styles.periodLabel, { fontFamily: theme.fMono, color: theme.sub }]}
                  value={p.label}
                  onChangeText={(label) => updatePeriod(i, { label })}
                  accessibilityLabel={`Name of class slot ${i + 1}`}
                />
                <View style={styles.timeRow}>
                  <TextInput style={timeInput(!!err && parseTime(p.start) === null)} value={p.start} onChangeText={(start) => updatePeriod(i, { start })} placeholder="9:15" placeholderTextColor={theme.soft} accessibilityLabel={`${p.label} starts`} />
                  <Text style={[styles.arrow, { color: theme.soft }]}>→</Text>
                  <TextInput style={timeInput(!!err && parseTime(p.end) === null)} value={p.end} onChangeText={(end) => updatePeriod(i, { end })} placeholder="10:25" placeholderTextColor={theme.soft} accessibilityLabel={`${p.label} ends`} />
                </View>
                {err !== '' && <Text style={[styles.err, { fontFamily: theme.fBody, color: theme.red }]}>{err}</Text>}
              </View>
            );
          })}
        </View>

        <View style={styles.block}>
          <Text style={[styles.q, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>What are your classes called?</Text>
          <Text style={[styles.help, { fontFamily: theme.fBody, color: theme.sub }]}>Type each class once and pick the block it’s usually in. If your classes move around during the week, you’ll drag them into place next.</Text>
          {classes.map((c, i) => (
            <View key={c.id} style={[styles.classCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <View style={styles.classTop}>
                <Text style={styles.classEmoji}>{c.emoji}</Text>
                <TextInput
                  style={[styles.nameInput, { fontFamily: theme.fBodyMedium, color: theme.ink, borderBottomColor: theme.line }]}
                  value={c.name}
                  onChangeText={(name) => updateClass(c.id, { name })}
                  placeholder={`e.g. ${examples[i % examples.length]}`}
                  placeholderTextColor={theme.soft}
                  accessibilityLabel={`Class ${i + 1} name`}
                />
                <TouchableOpacity onPress={() => setClasses((prev) => prev.filter((x) => x.id !== c.id))} style={styles.remove} accessibilityLabel={`Remove ${c.name || 'class'}`}>
                  <Text style={{ color: theme.red, fontSize: 18 }}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.colorRow}>
                {CLASS_COLORS.map((col) => (
                  <TouchableOpacity key={col} style={[styles.colorDot, { backgroundColor: col }, c.color === col && { borderWidth: 3, borderColor: theme.ink }]} onPress={() => updateClass(c.id, { color: col })} accessibilityLabel={`Colour ${col}`} />
                ))}
              </View>
              <View style={styles.slotRow}>
                <Text style={[styles.slotQ, { fontFamily: theme.fMono, color: theme.soft }]}>USUAL BLOCK</Text>
                {periods.map((p, j) => {
                  const active = c.slot === j;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.slotPill, { backgroundColor: active ? c.color : 'transparent', borderColor: active ? c.color : theme.line }]}
                      onPress={() => { setSlotsChanged(true); setClasses((prev) => prev.map((x) => (x.id === c.id ? { ...x, slot: active ? null : j } : x.slot === j ? { ...x, slot: null } : x))); }}
                      accessibilityLabel={`${c.name || 'This class'} is usually in ${p.label}`}
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.slotPillText, { fontFamily: theme.fBodySemiBold, color: active ? '#fff' : theme.sub }]}>{j + 1}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={[styles.teacherInput, { fontFamily: theme.fBody, color: theme.ink, backgroundColor: theme.surfaceHi, borderColor: theme.line }]}
                value={c.teacher ?? ''}
                onChangeText={(teacher) => updateClass(c.id, { teacher })}
                placeholder="Teacher (optional)"
                placeholderTextColor={theme.soft}
              />
            </View>
          ))}
          <TouchableOpacity style={[styles.addRow, { borderColor: theme.line }]} onPress={() => setClasses((prev) => [...prev, blankClass(prev.length, 0)])}>
            <Text style={[styles.addText, { fontFamily: theme.fBodyMedium, color: theme.accent }]}>+ Add another class</Text>
          </TouchableOpacity>
        </View>

        {showErrors && named.length === 0 && <Text style={[styles.footerErr, { fontFamily: theme.fBody, color: theme.red }]}>Type at least one class name to continue.</Text>}
        {showErrors && anyPeriodError && <Text style={[styles.footerErr, { fontFamily: theme.fBody, color: theme.red }]}>Fix the times marked in red first.</Text>}
        <PrimaryBtn label="Next → your week" onPress={handleNext} />
        {store.onboarded && (
          <TouchableOpacity onPress={() => useStore.setState({ phase: 'main', onboardingStart: 'SchoolPicker' })} style={styles.cancel}>
            <Text style={[styles.cancelText, { fontFamily: theme.fMono, color: theme.soft }]}>cancel</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, gap: 14 },
  back: { fontSize: 13, letterSpacing: 0.5 },
  block: { gap: 10, marginTop: 6 },
  q: { fontSize: 16 },
  help: { fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { minWidth: 42, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  pillText: { fontSize: 15 },
  periodCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  periodLabel: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', paddingVertical: 0 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, minWidth: 0, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, textAlign: 'center' },
  arrow: { fontSize: 14 },
  err: { fontSize: 12 },
  classCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  classTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classEmoji: { fontSize: 18 },
  nameInput: { flex: 1, minWidth: 0, fontSize: 16, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 4 },
  remove: { padding: 4 },
  colorRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  colorDot: { width: 22, height: 22, borderRadius: 11 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  slotQ: { fontSize: 9, letterSpacing: 1, marginRight: 2 },
  slotPill: { width: 30, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  slotPillText: { fontSize: 13 },
  teacherInput: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  addRow: { borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', padding: 14, alignItems: 'center' },
  addText: { fontSize: 15 },
  footerErr: { fontSize: 13, textAlign: 'center' },
  cancel: { alignItems: 'center', padding: 8 },
  cancelText: { fontSize: 11, letterSpacing: 1 },
});
