import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Animated, PanResponder, Platform, AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { Class, Timetable } from '../../types';
import { WEEKDAYS } from '../../lib/timetable';
import { fmt12 } from '../../lib/time';
import MicroLabel from '../../components/MicroLabel';
import PrimaryBtn from '../../components/PrimaryBtn';
import SerifTitle from '../../components/SerifTitle';

type DayKey = '1' | '2' | '3' | '4' | '5';
type Theme = ReturnType<typeof makeTheme>;

const CORNER = 46;   // width of the block-label column
const HEAD = 34;     // height of the Mon–Fri header row
const ROW = 58;      // height of each block row
const NATIVE = Platform.OS !== 'web';

/**
 * One class block in the week grid. It wiggles like an iPhone home-screen
 * icon in edit mode; drag it onto another block to swap them, or tap it to
 * pick from a list.
 */
function JiggleCell({ cls, theme, label, jiggle, onTap, onDrop, onDragStart, onDragEnd }: {
  cls: Class | undefined; theme: Theme; label: string; jiggle: boolean;
  onTap: () => void; onDrop: (dx: number, dy: number) => void; onDragStart: () => void; onDragEnd: () => void;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const lift = useRef(new Animated.Value(1)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const [dragging, setDragging] = useState(false);
  const cb = useRef({ onTap, onDrop, onDragStart, onDragEnd });
  cb.current = { onTap, onDrop, onDragStart, onDragEnd };

  useEffect(() => {
    if (!jiggle || dragging) { wiggle.stopAnimation(); wiggle.setValue(0); return; }
    const speed = 105 + Math.random() * 30;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(wiggle, { toValue: 1, duration: speed, useNativeDriver: NATIVE }),
      Animated.timing(wiggle, { toValue: -1, duration: speed * 2, useNativeDriver: NATIVE }),
      Animated.timing(wiggle, { toValue: 0, duration: speed, useNativeDriver: NATIVE }),
    ]));
    const t = setTimeout(() => loop.start(), Math.random() * 250);
    return () => { clearTimeout(t); loop.stop(); };
  }, [jiggle, dragging]);

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 3,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      setDragging(true);
      cb.current.onDragStart();
      Animated.spring(lift, { toValue: 1.12, useNativeDriver: NATIVE, friction: 6 }).start();
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      const moved = Math.abs(g.dx) + Math.abs(g.dy) > 8;
      setDragging(false);
      cb.current.onDragEnd();
      Animated.spring(lift, { toValue: 1, useNativeDriver: NATIVE, friction: 6 }).start();
      if (moved) cb.current.onDrop(g.dx, g.dy); else cb.current.onTap();
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderTerminate: () => {
      setDragging(false);
      cb.current.onDragEnd();
      lift.setValue(1);
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  })).current;

  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-2.2deg', '2.2deg'] });

  return (
    <Animated.View
      {...responder.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Drag onto another block to swap, or tap to choose a class"
      style={[
        styles.cellChip,
        {
          backgroundColor: cls ? cls.color + (dragging ? '55' : '26') : theme.surfaceHi,
          borderColor: cls ? cls.color : theme.line,
          zIndex: dragging ? 50 : 1,
          elevation: dragging ? 12 : 0,
          shadowOpacity: dragging ? 0.35 : 0,
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: lift }, { rotate }],
        },
        Platform.OS === 'web' ? ({ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' } as any) : null,
      ]}
    >
      <Text style={[styles.cellText, { fontFamily: theme.fBodyMedium, color: cls ? cls.color : theme.soft }]} numberOfLines={2}>
        {cls ? cls.name : 'Free'}
      </Text>
    </Animated.View>
  );
}

/**
 * "Step 3: Your week" — same order every day, or a Mon–Fri grid for
 * rotating schedules where blocks are dragged into place.
 */
export default function TimetableScreen({ navigation }: any) {
  const store = useStore();
  const theme = makeTheme(store.vibe, store.darkMode);
  const classes = store.classes;
  const tt = store.timetable;
  const [sameEveryDay, setSameEveryDay] = useState<boolean>(tt?.sameEveryDay ?? true);
  const [days, setDays] = useState<Timetable['days'] | undefined>(tt?.days);
  const [picking, setPicking] = useState<{ day: DayKey | 'all'; slot: number } | null>(null);
  const [gridW, setGridW] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [lastSwap, setLastSwap] = useState('');

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {}); }, []);

  if (!tt || !days) return null;
  const periods = tt.periods;
  const nameOf = (id: string | null) => classes.find((c) => c.id === id);
  const keys = WEEKDAYS.map((d) => d.key);

  function choose(classId: string | null) {
    if (!picking) return;
    setDays((prev) => {
      const next = { ...prev! } as Timetable['days'];
      const targets: DayKey[] = picking.day === 'all' ? keys : [picking.day];
      for (const k of targets) { const row = [...next[k]]; row[picking.slot] = classId; next[k] = row; }
      return next;
    });
    setPicking(null);
  }

  function dropAt(fromDay: number, fromSlot: number, dx: number, dy: number) {
    if (!gridW) return;
    const cellW = (gridW - CORNER) / 5;
    const cx = CORNER + fromDay * cellW + cellW / 2 + dx;
    const cy = HEAD + fromSlot * ROW + ROW / 2 + dy;
    const toDay = Math.floor((cx - CORNER) / cellW);
    const toSlot = Math.floor((cy - HEAD) / ROW);
    if (toDay < 0 || toDay > 4 || toSlot < 0 || toSlot >= periods.length) return;
    if (toDay === fromDay && toSlot === fromSlot) return;
    setDays((prev) => {
      const next = { ...prev! } as Timetable['days'];
      const a = keys[fromDay]; const b = keys[toDay];
      next[a] = [...next[a]]; if (b !== a) next[b] = [...next[b]];
      const tmp = next[a][fromSlot];
      next[a][fromSlot] = next[b][toSlot];
      next[b][toSlot] = tmp;
      return next;
    });
    setLastSwap(`${WEEKDAYS[fromDay].short} ${periods[fromSlot].label} ↔ ${WEEKDAYS[toDay].short} ${periods[toSlot].label}`);
  }

  function setMode(same: boolean) {
    setSameEveryDay(same);
    if (same) setDays((prev) => ({ '1': [...prev!['1']], '2': [...prev!['1']], '3': [...prev!['1']], '4': [...prev!['1']], '5': [...prev!['1']] }));
  }

  function copyMonday() {
    setDays((prev) => ({ '1': [...prev!['1']], '2': [...prev!['1']], '3': [...prev!['1']], '4': [...prev!['1']], '5': [...prev!['1']] }));
  }

  function handleSave() {
    store.setSchedule(classes, { ...tt!, sameEveryDay, days: days! });
    if (store.onboarded) useStore.setState({ phase: 'main', onboardingStart: 'SchoolPicker' });
    else navigation.navigate('ParentPair');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={!dragActive}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { fontFamily: theme.fMono, color: theme.accent }]}>← back</Text>
        </TouchableOpacity>
        <MicroLabel color={theme.accent}>{store.onboarded ? 'Edit schedule' : 'Step 3 of 4'}</MicroLabel>
        <SerifTitle size={30}>Your week.</SerifTitle>

        <Text style={[styles.q, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>Are your classes in the same order every day?</Text>
        <View style={styles.modeRow}>
          {[
            { same: true, title: 'Same every day', sub: 'Block 1 is always the same class' },
            { same: false, title: 'They move around', sub: 'Classes rotate by day, like Sutherland' },
          ].map((m) => {
            const active = sameEveryDay === m.same;
            return (
              <TouchableOpacity
                key={String(m.same)}
                style={[styles.modeCard, { backgroundColor: active ? theme.accent + '1f' : theme.surface, borderColor: active ? theme.accent : theme.line }]}
                onPress={() => setMode(m.same)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.modeTitle, { fontFamily: theme.fBodySemiBold, color: active ? theme.accent : theme.ink }]}>{m.title}</Text>
                <Text style={[styles.modeSub, { fontFamily: theme.fBody, color: theme.sub }]}>{m.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {sameEveryDay ? (
          <View style={styles.list}>
            <Text style={[styles.help, { fontFamily: theme.fBody, color: theme.sub }]}>Tap a block to change its class.</Text>
            {periods.map((p, i) => {
              const c = nameOf(days['1'][i]);
              return (
                <TouchableOpacity key={p.id} style={[styles.slotRow, { backgroundColor: theme.surface }]} onPress={() => setPicking({ day: 'all', slot: i })} accessibilityLabel={`${p.label}, ${c?.name ?? 'free'}. Tap to change`}>
                  <View style={styles.slotInfo}>
                    <Text style={[styles.slotLabel, { fontFamily: theme.fMono, color: theme.sub }]}>{p.label.toUpperCase()}</Text>
                    <Text style={[styles.slotTime, { fontFamily: theme.fMono, color: theme.soft }]}>{fmt12(p.start)}–{fmt12(p.end)}</Text>
                  </View>
                  <View style={[styles.rowChip, { backgroundColor: c ? c.color + '26' : theme.surfaceHi, borderColor: c ? c.color : theme.line }]}>
                    <Text style={[styles.rowText, { fontFamily: theme.fBodyMedium, color: c ? c.color : theme.soft }]} numberOfLines={1}>{c ? `${c.emoji ?? ''} ${c.name}` : 'Free'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.list}>
            <View style={[styles.tipBox, { backgroundColor: theme.accent + '14', borderColor: theme.accent + '44' }]}>
              <Text style={[styles.tipText, { fontFamily: theme.fBody, color: theme.ink }]}>
                <Text style={{ fontFamily: theme.fBodySemiBold }}>Drag a class onto another block to swap them.</Text> Copy it from your school timetable, one day at a time. Tap a block to pick from a list instead.
              </Text>
            </View>
            <View style={[styles.grid, { borderColor: theme.line }]} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
              <View style={[styles.gridRow, { height: HEAD }]}>
                <View style={styles.gridCorner} />
                {WEEKDAYS.map((d) => (
                  <Text key={d.key} style={[styles.gridHead, { fontFamily: theme.fMono, color: theme.sub }]}>{d.short}</Text>
                ))}
              </View>
              {periods.map((p, i) => (
                <View key={p.id} style={[styles.gridRow, { height: ROW, borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth, zIndex: periods.length - i }]}>
                  <View style={styles.gridCorner}>
                    <Text style={[styles.gridSlot, { fontFamily: theme.fMono, color: theme.sub }]} numberOfLines={1}>{p.label.replace(/^Block /, 'B')}</Text>
                    <Text style={[styles.gridSlotTime, { fontFamily: theme.fMono, color: theme.soft }]}>{fmt12(p.start)}</Text>
                  </View>
                  {WEEKDAYS.map((d, dayIdx) => (
                    <View key={d.key} style={styles.gridCell}>
                      <JiggleCell
                        cls={nameOf(days[d.key][i])}
                        theme={theme}
                        jiggle={!reduceMotion}
                        label={`${d.long} ${p.label}: ${nameOf(days[d.key][i])?.name ?? 'free'}. Tap to change`}
                        onTap={() => setPicking({ day: d.key, slot: i })}
                        onDrop={(dx, dy) => dropAt(dayIdx, i, dx, dy)}
                        onDragStart={() => setDragActive(true)}
                        onDragEnd={() => setDragActive(false)}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
            <View style={styles.gridFoot}>
              <TouchableOpacity onPress={copyMonday}>
                <Text style={[styles.copyMonText, { fontFamily: theme.fMono, color: theme.accent }]}>Copy Monday to every day</Text>
              </TouchableOpacity>
              {lastSwap !== '' && <Text style={[styles.swapNote, { fontFamily: theme.fMono, color: theme.soft }]}>Swapped {lastSwap}</Text>}
            </View>
          </View>
        )}

        <PrimaryBtn label={store.onboarded ? 'Save schedule' : 'Next → almost done'} onPress={handleSave} style={{ marginTop: 8 }} />
      </ScrollView>

      <Modal visible={!!picking} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <TouchableOpacity style={styles.pickBackdrop} activeOpacity={1} onPress={() => setPicking(null)}>
          <View style={[styles.pickCard, { backgroundColor: theme.bg }]} onStartShouldSetResponder={() => true}>
            {picking && (
              <Text style={[styles.pickTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
                {picking.day === 'all' ? 'Every day' : WEEKDAYS.find((d) => d.key === picking.day)!.long} · {periods[picking.slot].label}
              </Text>
            )}
            {classes.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.pickRow, { borderColor: c.color, backgroundColor: c.color + '18' }]} onPress={() => choose(c.id)}>
                <Text style={[styles.pickText, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{c.emoji} {c.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.pickRow, { borderColor: theme.line }]} onPress={() => choose(null)}>
              <Text style={[styles.pickText, { fontFamily: theme.fBody, color: theme.soft }]}>Free block / nothing</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 14 },
  back: { fontSize: 13, letterSpacing: 0.5 },
  q: { fontSize: 16, marginTop: 4 },
  help: { fontSize: 13, lineHeight: 19 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: { flex: 1, borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 4 },
  modeTitle: { fontSize: 15 },
  modeSub: { fontSize: 12, lineHeight: 17 },
  list: { gap: 10 },
  tipBox: { borderWidth: 1, borderRadius: 14, padding: 12 },
  tipText: { fontSize: 13, lineHeight: 19 },
  slotRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, gap: 12 },
  slotInfo: { width: 96, gap: 2 },
  slotLabel: { fontSize: 11, letterSpacing: 1 },
  slotTime: { fontSize: 10 },
  rowChip: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  rowText: { fontSize: 15 },
  grid: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  gridRow: { flexDirection: 'row', alignItems: 'stretch' },
  gridCorner: { width: CORNER, justifyContent: 'center', paddingLeft: 6 },
  gridHead: { flex: 1, textAlign: 'center', fontSize: 11, letterSpacing: 0.5, textAlignVertical: 'center', paddingTop: 10 },
  gridSlot: { fontSize: 11 },
  gridSlotTime: { fontSize: 8 },
  gridCell: { flex: 1, padding: 3 },
  cellChip: { flex: 1, borderWidth: 1, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowRadius: 10 },
  cellText: { fontSize: 9, textAlign: 'center', lineHeight: 11, letterSpacing: -0.2 },
  gridFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  copyMonText: { fontSize: 12, letterSpacing: 0.3 },
  swapNote: { fontSize: 10 },
  pickBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  pickCard: { borderRadius: 22, padding: 18, gap: 8, maxWidth: 420, width: '100%', alignSelf: 'center' },
  pickTitle: { fontSize: 22, marginBottom: 4 },
  pickRow: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  pickText: { fontSize: 15 },
});
