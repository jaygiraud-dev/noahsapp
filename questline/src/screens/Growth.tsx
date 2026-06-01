import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { T, PILLARS } from '../theme';
import { IDEAS, BOOKS, CHALLENGES } from '../data/growth';
import { registerQuest } from '../data/quests';
import { cooldownRemainingMs, fmtCooldown } from '../economy';
import type { Difficulty } from '../theme';
import ShineCard from '../components/ShineCard';
import { tap, pop } from '../haptics';

// Register every spawnable Growth quest into the registry once, at module load,
// so "Start as quest" resolves by a stable id everywhere.
IDEAS.forEach((i) =>
  registerQuest({ id: `g-${i.id}`, title: i.spawn.title, type: 'Mind', difficulty: i.spawn.difficulty, stats: i.spawn.stats, emoji: i.spawn.emoji, desc: i.spawn.desc })
);
CHALLENGES.forEach((c) =>
  registerQuest({ id: `g-${c.id}`, title: c.perDay.title, type: 'Soul', difficulty: c.perDay.difficulty, stats: c.perDay.stats, emoji: c.perDay.emoji, desc: c.perDay.desc })
);

export default function Growth() {
  const insets = useSafeAreaInsets();
  const addQuest = useStore((s) => s.addQuest);
  const userQuests = useStore((s) => s.userQuests);
  const lastCompleted = useStore((s) => s.lastCompleted);
  const [flash, setFlash] = useState<string | null>(null);

  const added = new Set(userQuests.filter((u) => u.status === 'active').map((u) => u.questId));
  const lockFor = (id: string, diff: Difficulty) => {
    const r = cooldownRemainingMs(lastCompleted[id], diff);
    return r > 0 ? fmtCooldown(r) : null;
  };

  const start = (id: string, title: string) => {
    pop();
    addQuest(id);
    setFlash(`“${title}” added to Today ✦`);
    setTimeout(() => setFlash(null), 1700);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 140, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>GROWTH</Text>
        <Text style={styles.head}>Learn, then <Text style={styles.headEm}>take action.</Text></Text>

        {/* Ideas */}
        <SectionLabel>IDEAS</SectionLabel>
        {IDEAS.map((i) => (
          <ShineCard key={i.id} style={styles.ideaCard}>
            <View style={styles.ideaTop}>
              <View style={[styles.ideaGlyph, { backgroundColor: PILLARS[i.pillar].color + '1E', borderColor: PILLARS[i.pillar].color + '44' }]}>
                <Text style={[styles.ideaGlyphTxt, { color: PILLARS[i.pillar].color }]}>{PILLARS[i.pillar].glyph}</Text>
              </View>
              <Text style={styles.ideaRead}>{i.read} read</Text>
            </View>
            <Text style={styles.ideaTitle}>{i.title}</Text>
            <Text style={styles.ideaBlurb}>{i.blurb}</Text>
            {(() => {
              const id = `g-${i.id}`;
              const isAdded = added.has(id);
              const lock = !isAdded ? lockFor(id, i.spawn.difficulty) : null;
              return (
                <TouchableOpacity activeOpacity={0.85} onPress={() => start(id, i.spawn.title)} disabled={isAdded || !!lock}>
                  <View style={[styles.cta, (isAdded || lock) && styles.ctaDone]}>
                    <Text style={[styles.ctaTxt, isAdded && { color: '#34D399' }, lock && { color: T.soft }]}>
                      {isAdded ? '✓ Added' : lock ? `🔒 Done · ready in ${lock}` : `Start as quest · ${i.spawn.emoji}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })()}
          </ShineCard>
        ))}

        {/* Challenges */}
        <SectionLabel>CHALLENGES</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {CHALLENGES.map((c) => (
            <ShineCard key={c.id} style={styles.challengeCard}>
              <LinearGradient
                colors={[PILLARS[c.pillar].color + '40', '#0C0C0E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.challengeHero}
              >
                <Text style={styles.challengeEmoji}>{c.emoji}</Text>
                <View style={styles.challengeDays}>
                  <Text style={styles.challengeDaysTxt}>{c.days} days</Text>
                </View>
              </LinearGradient>
              <View style={styles.challengeBody}>
                <Text style={styles.challengeTitle}>{c.title}</Text>
                <Text style={styles.challengeBlurb} numberOfLines={3}>{c.blurb}</Text>
                {(() => {
                  const id = `g-${c.id}`;
                  const isAdded = added.has(id);
                  const lock = !isAdded ? lockFor(id, c.perDay.difficulty) : null;
                  const inactive = isAdded || !!lock;
                  return (
                    <TouchableOpacity activeOpacity={0.85} onPress={() => start(id, c.title)} disabled={inactive}>
                      <LinearGradient
                        colors={inactive ? ['#1E1E22', '#1E1E22'] : T.accentGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.challengeBtn}
                      >
                        <Text style={[styles.challengeBtnTxt, isAdded && { color: '#34D399' }, lock && { color: T.soft }]}>
                          {isAdded ? '✓ Started' : lock ? `🔒 Ready in ${lock}` : 'Start challenge'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </ShineCard>
          ))}
        </ScrollView>

        {/* Continue Reading */}
        <SectionLabel>CONTINUE READING</SectionLabel>
        {BOOKS.map((b) => (
          <ShineCard key={b.id} style={styles.bookCard}>
            <View style={styles.bookCover}>
              <Text style={styles.bookEmoji}>{b.emoji}</Text>
            </View>
            <View style={styles.bookBody}>
              <Text style={styles.bookTitle}>{b.title}</Text>
              <Text style={styles.bookAuthor}>{b.author}</Text>
              <Text style={styles.bookOne} numberOfLines={2}>{b.oneLine}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(b.progress * 100)}%` }]} />
              </View>
              <Text style={styles.bookProgress}>{b.progress === 0 ? 'Not started' : `${Math.round(b.progress * 100)}% · continue`}</Text>
            </View>
          </ShineCard>
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

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kicker: { fontFamily: T.fMono, fontSize: 11, color: T.accent, letterSpacing: 3, marginLeft: 2 },
  head: { fontFamily: T.fDisplay, fontSize: 36, color: T.ink, marginTop: 8, marginLeft: 2 },
  headEm: { fontFamily: T.fDisplayIt, color: T.accent },
  sectionLabel: { fontFamily: T.fMono, fontSize: 11, color: T.soft, letterSpacing: 2, marginTop: 28, marginBottom: 14, marginLeft: 2 },

  ideaCard: { padding: 18, marginBottom: 14, gap: 11 },
  ideaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ideaGlyph: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  ideaGlyphTxt: { fontSize: 20 },
  ideaRead: { fontFamily: T.fMono, fontSize: 11, color: T.soft },
  ideaTitle: { fontFamily: T.fDisplay, fontSize: 28, color: T.ink, lineHeight: 32 },
  ideaBlurb: { fontFamily: T.fBody, fontSize: 14, color: T.sub, lineHeight: 21 },
  cta: { borderRadius: 14, borderWidth: 1, borderColor: T.accent + '55', backgroundColor: T.accent + '14', paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  ctaDone: { borderColor: 'rgba(52,211,153,0.45)', backgroundColor: 'rgba(52,211,153,0.12)' },
  ctaTxt: { fontFamily: T.fSemi, fontSize: 14, color: T.accent },

  hRow: { gap: 14, paddingRight: 18 },
  challengeCard: { width: 270 },
  challengeHero: { height: 130, justifyContent: 'center', alignItems: 'center' },
  challengeEmoji: { fontSize: 50 },
  challengeDays: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  challengeDaysTxt: { fontFamily: T.fMono, fontSize: 11, color: '#fff' },
  challengeBody: { padding: 16, gap: 9 },
  challengeTitle: { fontFamily: T.fDisplayIt, fontSize: 24, color: T.ink },
  challengeBlurb: { fontFamily: T.fBody, fontSize: 13, color: T.sub, lineHeight: 19, minHeight: 57 },
  challengeBtn: { borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 2 },
  challengeBtnTxt: { fontFamily: T.fSemi, fontSize: 14, color: '#fff' },

  bookCard: { flexDirection: 'row', marginBottom: 14 },
  bookCover: { width: 84, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center' },
  bookEmoji: { fontSize: 38 },
  bookBody: { flex: 1, padding: 16, gap: 5 },
  bookTitle: { fontFamily: T.fSemi, fontSize: 17, color: T.ink },
  bookAuthor: { fontFamily: T.fMono, fontSize: 11, color: T.soft },
  bookOne: { fontFamily: T.fBody, fontSize: 13, color: T.sub, lineHeight: 19, marginTop: 2 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: T.accent, borderRadius: 3 },
  bookProgress: { fontFamily: T.fMono, fontSize: 10.5, color: T.soft, marginTop: 4 },

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
