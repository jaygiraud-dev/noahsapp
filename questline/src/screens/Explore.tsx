import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { T, PILLAR_KEYS, PILLARS, Pillar, Difficulty, DIFF_LABEL } from '../theme';
import { QUESTS } from '../data/quests';
import QuestCard from '../components/QuestCard';
import { FilterPill } from '../components/Pills';
import { tap, pop } from '../haptics';

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard', 'epic'];

export default function Explore() {
  const insets = useSafeAreaInsets();
  const addQuest = useStore((s) => s.addQuest);
  const userQuests = useStore((s) => s.userQuests);
  const [pillar, setPillar] = useState<Pillar | null>(null);
  const [diff, setDiff] = useState<Difficulty | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const addedIds = new Set(userQuests.filter((u) => u.status === 'active').map((u) => u.questId));

  const list = useMemo(
    () =>
      QUESTS.filter((q) => {
        if (pillar && !Object.keys(q.stats).includes(pillar)) return false;
        if (diff && q.difficulty !== diff) return false;
        return true;
      }),
    [pillar, diff]
  );

  const onShare = (title: string) => {
    pop();
    // On web, use the Web Share API if present; otherwise show a confirmation flash.
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({ title: 'Questline', text: `I'm taking on "${title}" on Questline ✦` }).catch(() => {});
    }
    setFlash(`Shared "${title}" ✦`);
    setTimeout(() => setFlash(null), 1600);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 140, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>EXPLORE</Text>
        <Text style={styles.head}>Find your next <Text style={styles.headEm}>adventure.</Text></Text>

        {/* Pillar filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScroll}>
          <FilterPill label="All" active={!pillar} onPress={() => { tap(); setPillar(null); }} />
          {PILLAR_KEYS.map((p) => (
            <FilterPill
              key={p}
              label={PILLARS[p].label}
              tone={PILLARS[p].color}
              active={pillar === p}
              onPress={() => { tap(); setPillar(pillar === p ? null : p); }}
            />
          ))}
        </ScrollView>

        {/* Difficulty filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScrollTight}>
          <FilterPill label="Any difficulty" active={!diff} onPress={() => { tap(); setDiff(null); }} />
          {DIFFS.map((d) => (
            <FilterPill key={d} label={DIFF_LABEL[d]} active={diff === d} onPress={() => { tap(); setDiff(diff === d ? null : d); }} />
          ))}
        </ScrollView>

        <Text style={styles.count}>{list.length} quests</Text>

        {list.map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            added={addedIds.has(q.id)}
            onAdd={() => { pop(); addQuest(q.id); }}
            onShare={() => onShare(q.title)}
          />
        ))}
      </ScrollView>

      {flash && (
        <View style={[styles.flash, { bottom: insets.bottom + 110 }]}>
          <Text style={styles.flashTxt}>{flash}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kicker: { fontFamily: T.fMono, fontSize: 11, color: T.accent, letterSpacing: 3, marginLeft: 2 },
  head: { fontFamily: T.fDisplay, fontSize: 36, color: T.ink, marginTop: 8, marginLeft: 2 },
  headEm: { fontFamily: T.fDisplayIt, color: T.accent },
  filterScroll: { marginTop: 18 },
  filterScrollTight: { marginTop: 10 },
  filterRow: { gap: 8, paddingRight: 18 },
  count: { fontFamily: T.fMono, fontSize: 11, color: T.soft, letterSpacing: 1, marginTop: 18, marginBottom: 14, marginLeft: 2 },
  flash: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#1E1E22',
    borderWidth: 1,
    borderColor: T.accent + '55',
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  flashTxt: { fontFamily: T.fSemi, fontSize: 14, color: T.ink },
});
