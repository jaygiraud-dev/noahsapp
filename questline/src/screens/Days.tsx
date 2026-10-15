import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { T, PILLARS, Pillar } from '../theme';
import { getQuest } from '../data/quests';
import { multiplierLabel, pctOfYear, todayKey } from '../economy';
import ShineCard from '../components/ShineCard';
import { FilterPill } from '../components/Pills';
import { tap, pop, success } from '../haptics';

const MOOD_EMOJI: Record<string, string> = { rough: '😮‍💨', ok: '😌', great: '🔥' };
const PHOTO_MOTIFS = ['🌅', '🏔️', '🌿', '🌊', '🔥', '📚', '☕️', '🏃', '🎧', '🪷'];

function fmtDate(key: string) {
  return new Date(key + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Days() {
  const insets = useSafeAreaInsets();
  const days = useStore((s) => s.days);
  const journal = useStore((s) => s.journal);
  const userQuests = useStore((s) => s.userQuests);
  const addJournal = useStore((s) => s.addJournal);

  const [view, setView] = useState<'timeline' | 'journal'>('timeline');
  const [composer, setComposer] = useState(false);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(PHOTO_MOTIFS[0]);

  const sorted = [...days].sort((a, b) => (a.key < b.key ? 1 : -1));

  const submitEntry = () => {
    if (!text.trim()) return;
    success();
    addJournal(text.trim(), photo);
    setText('');
    setComposer(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 140, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>YOUR STORY</Text>
        <Text style={styles.head}>Days &amp; <Text style={styles.headEm}>Journal</Text></Text>

        <View style={styles.toggleRow}>
          <FilterPill label="Timeline" active={view === 'timeline'} onPress={() => { tap(); setView('timeline'); }} />
          <FilterPill label="Journal" active={view === 'journal'} onPress={() => { tap(); setView('journal'); }} />
        </View>

        {/* Time-awareness nudge */}
        <View style={styles.nudge}>
          <Text style={styles.nudgeTxt}>{pctOfYear()}% of {new Date().getFullYear()} has already passed.</Text>
        </View>

        {view === 'timeline' ? (
          sorted.length === 0 ? (
            <Empty label="Complete a quest and your first day appears here." />
          ) : (
            sorted.map((d) => {
              const completed = d.questUids
                .map((uid) => userQuests.find((u) => u.uid === uid))
                .map((u) => u && getQuest(u.questId))
                .filter(Boolean);
              const entry = d.journalId ? journal.find((j) => j.id === d.journalId) : undefined;
              return (
                <ShineCard key={d.key} style={styles.dayCard}>
                  <View style={styles.dayTop}>
                    <View>
                      <Text style={styles.dayNum}>Day {d.dayNumber}</Text>
                      <Text style={styles.dayDate}>{fmtDate(d.key)}{d.key === todayKey() ? ' · Today' : ''}</Text>
                    </View>
                    <View style={styles.dayBadges}>
                      {d.mood && <Text style={styles.dayMood}>{MOOD_EMOJI[d.mood]}</Text>}
                      <View style={styles.multiPill}>
                        <Text style={styles.multiPillTxt}>{multiplierLabel(d.multiplier)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.pointsRow}>
                    <Text style={[styles.points, { color: d.points > 0 ? T.accent : T.soft }]}>
                      {d.points > 0 ? '+' : ''}{d.points} ✦
                    </Text>
                    <Text style={styles.pointsLabel}>earned</Text>
                  </View>

                  {completed.map((q: any) => (
                    <View key={q.id} style={styles.questLine}>
                      <Text style={styles.questLineEmoji}>{q.emoji}</Text>
                      <Text style={styles.questLineTitle}>{q.title}</Text>
                      <View style={styles.questLineDots}>
                        {(Object.keys(q.stats) as Pillar[]).map((p) => (
                          <View key={p} style={[styles.miniDot, { backgroundColor: PILLARS[p].color }]} />
                        ))}
                      </View>
                    </View>
                  ))}

                  {entry && (
                    <View style={styles.journalSnippet}>
                      <Text style={styles.journalSnippetPhoto}>{entry.photo}</Text>
                      <Text style={styles.journalSnippetTxt} numberOfLines={2}>{entry.text}</Text>
                    </View>
                  )}
                </ShineCard>
              );
            })
          )
        ) : journal.length === 0 ? (
          <Empty label="No entries yet. Capture a moment from today." />
        ) : (
          journal.map((e) => (
            <ShineCard key={e.id} style={styles.entryCard}>
              <LinearGradient colors={[T.accent + '30', '#0C0C0E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.entryPhoto}>
                <Text style={styles.entryPhotoEmoji}>{e.photo}</Text>
              </LinearGradient>
              <View style={styles.entryBody}>
                <Text style={styles.entryDate}>{fmtDate(e.day)}</Text>
                <Text style={styles.entryText}>{e.text}</Text>
              </View>
            </ShineCard>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.fab, { bottom: insets.bottom + 96 }]}
        onPress={() => { pop(); setComposer(true); }}
      >
        <LinearGradient colors={T.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGrad}>
          <Text style={styles.fabTxt}>＋ Journal</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Composer */}
      <Modal visible={composer} transparent animationType="slide" onRequestClose={() => setComposer(false)}>
        <Pressable style={styles.modalBg} onPress={() => setComposer(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetGrab} />
            <Text style={styles.sheetTitle}>New journal entry</Text>
            <Text style={styles.sheetSub}>Pick a moment. Saved to today.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.motifRow}>
              {PHOTO_MOTIFS.map((m) => (
                <TouchableOpacity key={m} onPress={() => { tap(); setPhoto(m); }} style={[styles.motif, photo === m && styles.motifOn]}>
                  <Text style={styles.motifEmoji}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.composerInput}
              placeholder="What happened today? What did it mean?"
              placeholderTextColor={T.soft}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
            />
            <TouchableOpacity activeOpacity={0.9} onPress={submitEntry} style={{ opacity: text.trim() ? 1 : 0.4 }}>
              <LinearGradient colors={T.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
                <Text style={styles.saveTxt}>Save entry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📓</Text>
      <Text style={styles.emptyTxt}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kicker: { fontFamily: T.fMono, fontSize: 11, color: T.accent, letterSpacing: 3, marginLeft: 2 },
  head: { fontFamily: T.fDisplay, fontSize: 36, color: T.ink, marginTop: 8, marginLeft: 2 },
  headEm: { fontFamily: T.fDisplayIt, color: T.accent },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  nudge: {
    marginTop: 18,
    backgroundColor: T.accent + '12',
    borderWidth: 1,
    borderColor: T.accent + '2E',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  nudgeTxt: { fontFamily: T.fMed, fontSize: 13, color: T.ink },

  dayCard: { padding: 18, marginTop: 14, gap: 12 },
  dayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dayNum: { fontFamily: T.fDisplayIt, fontSize: 26, color: T.ink },
  dayDate: { fontFamily: T.fMono, fontSize: 11, color: T.soft, marginTop: 2, letterSpacing: 0.3 },
  dayBadges: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayMood: { fontSize: 22 },
  multiPill: { borderWidth: 1, borderColor: T.line, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  multiPillTxt: { fontFamily: T.fMono, fontSize: 12, color: T.sub },
  pointsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  points: { fontFamily: T.fMonoB, fontSize: 22 },
  pointsLabel: { fontFamily: T.fMono, fontSize: 11, color: T.soft },
  questLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questLineEmoji: { fontSize: 18 },
  questLineTitle: { flex: 1, fontFamily: T.fMed, fontSize: 15, color: T.sub },
  questLineDots: { flexDirection: 'row', gap: 4 },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  journalSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
  },
  journalSnippetPhoto: { fontSize: 26 },
  journalSnippetTxt: { flex: 1, fontFamily: T.fBody, fontSize: 13, color: T.sub, fontStyle: 'italic' },

  entryCard: { marginTop: 14, flexDirection: 'row' },
  entryPhoto: { width: 96, justifyContent: 'center', alignItems: 'center' },
  entryPhotoEmoji: { fontSize: 40 },
  entryBody: { flex: 1, padding: 16, gap: 6 },
  entryDate: { fontFamily: T.fMono, fontSize: 11, color: T.soft, letterSpacing: 0.3 },
  entryText: { fontFamily: T.fBody, fontSize: 14, color: T.ink, lineHeight: 21 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 50 },
  emptyEmoji: { fontSize: 40 },
  emptyTxt: { fontFamily: T.fBody, fontSize: 14, color: T.soft, textAlign: 'center', paddingHorizontal: 40 },

  fab: { position: 'absolute', right: 18 },
  fabGrad: { borderRadius: 100, paddingHorizontal: 22, paddingVertical: 14, shadowColor: T.accent, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  fabTxt: { fontFamily: T.fSemi, fontSize: 15, color: '#fff' },

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
  motifRow: { gap: 10, paddingVertical: 4 },
  motif: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: T.line, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface },
  motifOn: { borderColor: T.accent, backgroundColor: T.accent + '18' },
  motifEmoji: { fontSize: 26 },
  composerInput: {
    marginTop: 16,
    minHeight: 90,
    fontFamily: T.fBody,
    fontSize: 16,
    color: T.ink,
    backgroundColor: T.surface,
    borderRadius: 14,
    padding: 14,
    textAlignVertical: 'top',
  },
  saveBtn: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  saveTxt: { fontFamily: T.fSemi, fontSize: 16, color: '#fff' },
});
