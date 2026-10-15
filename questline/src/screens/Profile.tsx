import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { T, PILLAR_KEYS, PILLARS } from '../theme';
import { fmtAura, fmtSparks } from '../economy';
import ShineCard from '../components/ShineCard';
import StreakCard from '../components/StreakCard';
import StatBar from '../components/StatBar';
import Sparkle from '../components/Sparkle';
import { tap, pop } from '../haptics';

const RANGES = [
  { key: 'now', label: 'Now', days: 1 },
  { key: '7d', label: '7d', days: 7 },
  { key: '30d', label: '30d', days: 30 },
  { key: '90d', label: '90d', days: 90 },
  { key: '1y', label: '1y', days: 366 },
] as const;

function Sparkline({ values, height = 96 }: { values: number[]; height?: number }) {
  if (values.length < 2) values = [values[0] ?? 0, values[0] ?? 0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const bars = values.length > 60 ? values.filter((_, i) => i % Math.ceil(values.length / 60) === 0) : values;
  return (
    <View style={[styles.spark, { height }]}>
      {bars.map((v, i) => {
        const h = 14 + ((v - min) / span) * (height - 18);
        return (
          <View key={i} style={[styles.sparkBarWrap, { height }]}>
            <LinearGradient
              colors={[T.accentGrad[1], T.accentGrad[0]]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={[styles.sparkBar, { height: h, opacity: 0.35 + (i / bars.length) * 0.65 }]}
            />
          </View>
        );
      })}
    </View>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const stats = useStore((s) => s.stats);
  const aura = useStore((s) => s.aura);
  const auraHistory = useStore((s) => s.auraHistory);
  const sparksWallet = useStore((s) => s.sparksWallet);
  const name = useStore((s) => s.name);
  const startDate = useStore((s) => s.startDate);
  const reset = useStore((s) => s.reset);

  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('30d');
  const [settings, setSettings] = useState(false);

  const { series, delta } = useMemo(() => {
    const r = RANGES.find((x) => x.key === range)!;
    const slice = auraHistory.slice(-r.days);
    const series = slice.map((p) => p.value);
    const delta = series.length >= 2 ? series[series.length - 1] - series[0] : 0;
    return { series, delta };
  }, [range, auraHistory]);

  const startLabel = new Date(startDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 140, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>PROFILE</Text>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.since}>Questing since {startLabel}</Text>
          </View>
          <TouchableOpacity onPress={() => { tap(); setSettings(true); }} style={styles.gear}>
            <Text style={styles.gearTxt}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Aura hero */}
        <ShineCard style={styles.auraCard} glow={T.accent}>
          <View style={styles.auraTop}>
            <View style={styles.auraLabelRow}>
              <Sparkle size={16} />
              <Text style={styles.auraLabel}>AURA</Text>
            </View>
            <Text style={[styles.auraDelta, { color: delta >= 0 ? '#34D399' : T.sub }]}>
              {delta >= 0 ? '▲' : '▼'} {fmtAura(Math.abs(delta))} · {range}
            </Text>
          </View>
          <Text style={styles.auraValue}>{fmtAura(aura)}</Text>
          <Sparkline values={series} />
          <View style={styles.rangeRow}>
            {RANGES.map((r) => (
              <TouchableOpacity
                key={r.key}
                onPress={() => { tap(); setRange(r.key); }}
                style={[styles.rangeBtn, range === r.key && styles.rangeBtnOn]}
              >
                <Text style={[styles.rangeTxt, range === r.key && { color: T.ink }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ShineCard>

        {/* Lifetime sparks */}
        <View style={styles.walletRow}>
          <ShineCard style={styles.walletCard}>
            <Text style={styles.walletNum}>{fmtSparks(sparksWallet)} ✦</Text>
            <Text style={styles.walletLabel}>Sparks earned</Text>
          </ShineCard>
          <ShineCard style={styles.walletCard}>
            <Text style={styles.walletNum}>{useStore.getState().userQuests.filter((u) => u.status === 'done').length}</Text>
            <Text style={styles.walletLabel}>Quests done</Text>
          </ShineCard>
        </View>

        {/* Streak */}
        <View style={{ height: 16 }} />
        <StreakCard />

        {/* Stats */}
        <Text style={styles.sectionLabel}>YOUR STATS</Text>
        <ShineCard style={styles.statsCard}>
          {PILLAR_KEYS.map((p, i) => (
            <View key={p} style={i > 0 ? { marginTop: 20 } : undefined}>
              <StatBar pillar={p} value={stats[p].value} recent={stats[p].recent} />
            </View>
          ))}
        </ShineCard>

        <Text style={styles.legend}>Aura is your lifetime flex. Stats are how you actually know yourself.</Text>
      </ScrollView>

      {/* Settings */}
      <Modal visible={settings} transparent animationType="slide" onRequestClose={() => setSettings(false)}>
        <Pressable style={styles.modalBg} onPress={() => setSettings(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetGrab} />
            <Text style={styles.sheetTitle}>Settings</Text>
            {['Account · Sign in with Apple', 'Notifications', 'Theme', 'Questline Plus', 'Export data'].map((row) => (
              <View key={row} style={styles.settingRow}>
                <Text style={styles.settingTxt}>{row}</Text>
                <Text style={styles.settingChevron}>›</Text>
              </View>
            ))}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { pop(); setSettings(false); reset(); }}
              style={styles.resetBtn}
            >
              <Text style={styles.resetTxt}>Reset progress (start a new save)</Text>
            </TouchableOpacity>
            <Text style={styles.version}>Questline v0.1 · your save lives on this device</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kicker: { fontFamily: T.fMono, fontSize: 11, color: T.accent, letterSpacing: 3 },
  name: { fontFamily: T.fDisplayIt, fontSize: 38, color: T.ink, marginTop: 6 },
  since: { fontFamily: T.fMono, fontSize: 11, color: T.soft, marginTop: 2 },
  gear: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: T.line, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface },
  gearTxt: { fontSize: 20, color: T.sub },

  auraCard: { padding: 20, marginTop: 20 },
  auraTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auraLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  auraLabel: { fontFamily: T.fMono, fontSize: 12, color: T.sub, letterSpacing: 3 },
  auraDelta: { fontFamily: T.fMono, fontSize: 12 },
  auraValue: { fontFamily: T.fMonoB, fontSize: 56, color: T.ink, letterSpacing: -2, marginTop: 6 },
  rangeRow: { flexDirection: 'row', gap: 7, marginTop: 16 },
  rangeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  rangeBtnOn: { backgroundColor: T.accent + '26' },
  rangeTxt: { fontFamily: T.fMono, fontSize: 12, color: T.soft },

  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 18 },
  sparkBarWrap: { flex: 1, justifyContent: 'flex-end' },
  sparkBar: { width: '100%', borderRadius: 3, minWidth: 2 },

  walletRow: { flexDirection: 'row', gap: 14, marginTop: 14 },
  walletCard: { flex: 1, padding: 18, alignItems: 'flex-start', gap: 4 },
  walletNum: { fontFamily: T.fMonoB, fontSize: 24, color: T.ink },
  walletLabel: { fontFamily: T.fMono, fontSize: 11, color: T.soft },

  sectionLabel: { fontFamily: T.fMono, fontSize: 11, color: T.soft, letterSpacing: 2, marginTop: 28, marginBottom: 14 },
  statsCard: { padding: 20 },
  legend: { fontFamily: T.fBody, fontSize: 13, color: T.soft, fontStyle: 'italic', textAlign: 'center', marginTop: 20, lineHeight: 20, paddingHorizontal: 20 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#141416',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: T.surfaceEdge,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetGrab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: T.faint, marginBottom: 16 },
  sheetTitle: { fontFamily: T.fDisplayIt, fontSize: 26, color: T.ink, marginBottom: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: T.line },
  settingTxt: { fontFamily: T.fMed, fontSize: 15, color: T.ink },
  settingChevron: { fontFamily: T.fBody, fontSize: 20, color: T.soft },
  resetBtn: { marginTop: 18, borderRadius: 14, borderWidth: 1, borderColor: '#FF4D5E55', backgroundColor: '#FF4D5E14', paddingVertical: 14, alignItems: 'center' },
  resetTxt: { fontFamily: T.fSemi, fontSize: 14, color: '#FF4D5E' },
  version: { fontFamily: T.fMono, fontSize: 11, color: T.soft, textAlign: 'center', marginTop: 16 },
});
