import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, PILLARS, Pillar, TYPE_COLOR } from '../theme';
import ShineCard from './ShineCard';
import { TypePill, DiffPill, RewardPill } from './Pills';
import type { Quest } from '../data/quests';

// A 2×2 gradient "photo collage" stand-in — moody, on-brand, fully offline.
function Collage({ quest }: { quest: Quest }) {
  const base = TYPE_COLOR[quest.type];
  const pillars = Object.keys(quest.stats) as Pillar[];
  const tints = [
    base,
    PILLARS[pillars[0] ?? 'mind'].color,
    PILLARS[pillars[1] ?? pillars[0] ?? 'soul'].color,
    base,
  ];
  return (
    <View style={styles.collage}>
      {tints.map((c, i) => (
        <LinearGradient
          key={i}
          colors={[c + '4D', '#0C0C0E']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tile}
        />
      ))}
      <View style={styles.collageOverlay}>
        <Text style={styles.collageEmoji}>{quest.emoji}</Text>
      </View>
    </View>
  );
}

export default function QuestCard({
  quest,
  onAdd,
  onShare,
  added,
  lockLabel,
}: {
  quest: Quest;
  onAdd?: () => void;
  onShare?: () => void;
  added?: boolean;
  lockLabel?: string; // e.g. "6d" — on cooldown, can't be re-accepted yet
}) {
  return (
    <ShineCard style={styles.card}>
      <Collage quest={quest} />
      <View style={styles.body}>
        <View style={styles.pillsRow}>
          <TypePill type={quest.type} />
          <DiffPill difficulty={quest.difficulty} />
          <RewardPill difficulty={quest.difficulty} />
        </View>
        <Text style={styles.title}>{quest.title}</Text>
        <Text style={styles.desc}>{quest.desc}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onAdd}
            disabled={added || !!lockLabel}
            style={styles.addBtnWrap}
          >
            {added ? (
              <View style={[styles.addBtn, styles.addedBtn]}>
                <Text style={styles.addedTxt}>✓ On your Today</Text>
              </View>
            ) : lockLabel ? (
              <View style={[styles.addBtn, styles.lockedBtn]}>
                <Text style={styles.lockedTxt}>🔒 Completed · ready in {lockLabel}</Text>
              </View>
            ) : (
              <LinearGradient colors={T.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtn}>
                <Text style={styles.addTxt}>Accept Quest</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
          {onShare && (
            <TouchableOpacity activeOpacity={0.7} onPress={onShare} style={styles.shareBtn}>
              <Text style={styles.shareTxt}>↗</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ShineCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  collage: { height: 168, flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '50%', height: '50%' },
  collageOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  collageEmoji: { fontSize: 56 },
  body: { padding: 18, gap: 11 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  title: { fontFamily: T.fDisplay, fontSize: 30, color: T.ink, lineHeight: 34 },
  desc: { fontFamily: T.fBody, fontSize: 14, color: T.sub, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  addBtnWrap: { flex: 1 },
  addBtn: { borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  addTxt: { fontFamily: T.fSemi, fontSize: 15, color: '#fff', letterSpacing: 0.2 },
  addedBtn: { backgroundColor: 'rgba(52,211,153,0.14)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.45)' },
  addedTxt: { fontFamily: T.fSemi, fontSize: 14, color: '#34D399' },
  lockedBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: T.line },
  lockedTxt: { fontFamily: T.fSemi, fontSize: 13, color: T.soft },
  shareBtn: {
    width: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareTxt: { fontFamily: T.fSemi, fontSize: 20, color: T.sub },
});
