import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { T, PILLARS, Pillar } from '../theme';
import { QUESTS, getQuest, sparksForDifficulty } from '../data/quests';
import { todayKey, cooldownRemainingMs, fmtCooldown } from '../economy';
import ShineCard from '../components/ShineCard';
import StreakCard from '../components/StreakCard';
import Sparkle from '../components/Sparkle';
import { tap, pop, success } from '../haptics';
import type { Tab } from '../components/TabBar';

const MOODS: { key: 'rough' | 'ok' | 'great'; emoji: string; label: string }[] = [
  { key: 'rough', emoji: '😮‍💨', label: 'Rough' },
  { key: 'ok', emoji: '😌', label: 'Okay' },
  { key: 'great', emoji: '🔥', label: 'Great' },
];

const QUICK = [
  { id: 'quest', icon: '✦', label: 'New quest', tint: T.accent },
  { id: 'habit', icon: '☀', label: 'Daily habit', tint: '#F5C04A' },
  { id: 'hard', icon: '💀', label: 'Hard mode', tint: '#FF2E8B' },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Today({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  const name = useStore((s) => s.name);
  const userQuests = useStore((s) => s.userQuests);
  const days = useStore((s) => s.days);
  const completeQuest = useStore((s) => s.completeQuest);
  const quickComplete = useStore((s) => s.quickComplete);
  const setMood = useStore((s) => s.setMood);
  const lastCompleted = useStore((s) => s.lastCompleted);

  const today = todayKey();
  const todayRec = days.find((d) => d.key === today);
  const active = userQuests.filter((u) => u.status === 'active');
  const doneToday = userQuests.filter((u) => u.status === 'done' && u.doneDay === today);

  const [sheet, setSheet] = useState<null | 'habit' | 'hard'>(null);

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const handleQuick = (id: string) => {
    pop();
    if (id === 'quest') onNavigate('explore');
    else if (id === 'habit') setSheet('habit');
    else setSheet('hard');
  };

  const onComplete = (uid: string) => {
    success();
    completeQuest(uid);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 140, paddingHorizontal: 18 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name}>{name}.</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
        <Sparkle size={30} />
      </View>

      <View style={{ height: 18 }} />
      <StreakCard />

      {/* Quick log */}
      <View style={styles.quickRow}>
        {QUICK.map((q) => (
          <TouchableOpacity key={q.id} activeOpacity={0.85} style={styles.quickBtn} onPress={() => handleQuick(q.id)}>
            <View style={[styles.quickIcon, { borderColor: q.tint + '55', backgroundColor: q.tint + '14' }]}>
              <Text style={[styles.quickIconTxt, { color: q.tint }]}>{q.icon}</Text>
            </View>
            <Text style={styles.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mood */}
      <Text style={styles.sectionLabel}>HOW ARE YOU TODAY?</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => {
          const on = todayRec?.mood === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              activeOpacity={0.85}
              onPress={() => { tap(); setMood(m.key); }}
              style={[styles.moodBtn, on && { borderColor: T.accent, backgroundColor: T.accent + '14' }]}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, on && { color: T.ink }]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Today's quests */}
      <View style={styles.questHeader}>
        <Text style={styles.sectionLabel}>TODAY'S QUESTS</Text>
        <Text style={styles.questCount}>{active.length} active</Text>
      </View>

      {active.length === 0 && doneToday.length === 0 && (
        <ShineCard style={styles.empty}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyTitle}>No quests yet</Text>
          <Text style={styles.emptySub}>Your story is waiting. Find your next adventure.</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={() => { pop(); onNavigate('explore'); }}>
            <LinearGradient colors={T.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnTxt}>Explore quests</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ShineCard>
      )}

      {active.map((uq) => {
        const q = getQuest(uq.questId);
        if (!q) return null;
        return (
          <ShineCard key={uq.uid} style={styles.questCard}>
            <View style={styles.questRow}>
              <TouchableOpacity activeOpacity={0.8} style={styles.check} onPress={() => onComplete(uq.uid)}>
                <View style={styles.checkRing} />
              </TouchableOpacity>
              <View style={styles.questMid}>
                <Text style={styles.questEmoji}>{q.emoji} <Text style={styles.questTitle}>{q.title}</Text></Text>
                <View style={styles.questMeta}>
                  {(Object.keys(q.stats) as Pillar[]).map((p) => (
                    <View key={p} style={[styles.dotTag, { backgroundColor: PILLARS[p].color }]} />
                  ))}
                  <Text style={styles.questReward}>{sparksForDifficulty(q.difficulty)} ✦</Text>
                </View>
              </View>
            </View>
          </ShineCard>
        );
      })}

      {doneToday.map((uq) => {
        const q = getQuest(uq.questId);
        if (!q) return null;
        return (
          <View key={uq.uid} style={styles.doneCard}>
            <Text style={styles.doneCheck}>✓</Text>
            <Text style={styles.doneTitle}>{q.emoji} {q.title}</Text>
            <Text style={styles.doneReward}>+{sparksForDifficulty(q.difficulty)} ✦</Text>
          </View>
        );
      })}

      {/* Quick-log sheet */}
      <Modal visible={sheet !== null} transparent animationType="fade" onRequestClose={() => setSheet(null)}>
        <Pressable style={styles.modalBg} onPress={() => setSheet(null)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetGrab} />
            <Text style={styles.sheetTitle}>
              {sheet === 'habit' ? 'Log a daily habit' : 'Accept a hard quest'}
            </Text>
            <Text style={styles.sheetSub}>
              {sheet === 'habit' ? 'One tap to bank the Sparks.' : 'Adds it to today — go earn it.'}
            </Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {QUESTS.filter((q) => (sheet === 'habit' ? q.difficulty === 'easy' : q.difficulty === 'hard' || q.difficulty === 'epic'))
                .slice(0, 12)
                .map((q) => {
                  const remaining = cooldownRemainingMs(lastCompleted[q.id], q.difficulty);
                  const locked = remaining > 0;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      activeOpacity={locked ? 1 : 0.8}
                      disabled={locked}
                      style={[styles.sheetRow, locked && { opacity: 0.4 }]}
                      onPress={() => {
                        if (sheet === 'habit') { success(); quickComplete(q.id); }
                        else { pop(); useStore.getState().addQuest(q.id); }
                        setSheet(null);
                      }}
                    >
                      <Text style={styles.sheetEmoji}>{q.emoji}</Text>
                      <Text style={styles.sheetRowTitle}>{q.title}</Text>
                      <Text style={styles.sheetRowReward}>
                        {locked ? `🔒 ${fmtCooldown(remaining)}` : `${sparksForDifficulty(q.difficulty)} ✦`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 2 },
  greeting: { fontFamily: T.fBody, fontSize: 16, color: T.sub },
  name: { fontFamily: T.fDisplayIt, fontSize: 40, color: T.ink, marginTop: -2 },
  date: { fontFamily: T.fMono, fontSize: 12, color: T.soft, marginTop: 4, letterSpacing: 0.3 },

  quickRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  quickBtn: { flex: 1, alignItems: 'center', gap: 8 },
  quickIcon: { width: '100%', height: 54, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  quickIconTxt: { fontSize: 22 },
  quickLabel: { fontFamily: T.fMed, fontSize: 12, color: T.sub },

  sectionLabel: { fontFamily: T.fMono, fontSize: 11, color: T.soft, letterSpacing: 2, marginTop: 26, marginBottom: 12 },
  moodRow: { flexDirection: 'row', gap: 10 },
  moodBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.line,
    backgroundColor: T.surface,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontFamily: T.fMed, fontSize: 12, color: T.soft },

  questHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  questCount: { fontFamily: T.fMono, fontSize: 11, color: T.accent, marginTop: 26, marginBottom: 12 },

  empty: { padding: 26, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontFamily: T.fDisplayIt, fontSize: 26, color: T.ink },
  emptySub: { fontFamily: T.fBody, fontSize: 14, color: T.sub, textAlign: 'center' },
  emptyBtn: { borderRadius: 16, paddingVertical: 13, paddingHorizontal: 28, marginTop: 10 },
  emptyBtnTxt: { fontFamily: T.fSemi, fontSize: 15, color: '#fff' },

  questCard: { padding: 16, marginBottom: 10 },
  questRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  check: { padding: 2 },
  checkRing: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: T.accent + '88' },
  questMid: { flex: 1, gap: 7 },
  questEmoji: { fontFamily: T.fBody, fontSize: 17 },
  questTitle: { fontFamily: T.fSemi, fontSize: 17, color: T.ink },
  questMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dotTag: { width: 7, height: 7, borderRadius: 4 },
  questReward: { fontFamily: T.fMono, fontSize: 12, color: T.accent, marginLeft: 4 },

  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(52,211,153,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.2)',
  },
  doneCheck: { color: '#34D399', fontFamily: T.fBold, fontSize: 16 },
  doneTitle: { flex: 1, fontFamily: T.fMed, fontSize: 15, color: T.sub, textDecorationLine: 'line-through' },
  doneReward: { fontFamily: T.fMono, fontSize: 12, color: '#34D399' },

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
  sheetTitle: { fontFamily: T.fDisplayIt, fontSize: 26, color: T.ink },
  sheetSub: { fontFamily: T.fBody, fontSize: 13, color: T.sub, marginTop: 2, marginBottom: 14 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.line,
  },
  sheetEmoji: { fontSize: 22 },
  sheetRowTitle: { flex: 1, fontFamily: T.fMed, fontSize: 16, color: T.ink },
  sheetRowReward: { fontFamily: T.fMono, fontSize: 13, color: T.accent },
});
