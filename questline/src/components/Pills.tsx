import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { T, Difficulty, DIFF_LABEL, DIFF_COLOR, QuestType, TYPE_COLOR } from '../theme';
import { sparksForDifficulty } from '../data/quests';

export function TypePill({ type }: { type: QuestType }) {
  const c = TYPE_COLOR[type];
  return (
    <View style={[styles.pill, { borderColor: c + '55', backgroundColor: c + '18' }]}>
      <Text style={[styles.txt, { color: c }]}>{type}</Text>
    </View>
  );
}

export function DiffPill({ difficulty }: { difficulty: Difficulty }) {
  const c = DIFF_COLOR[difficulty];
  return (
    <View style={[styles.pill, { borderColor: c + '55', backgroundColor: c + '18' }]}>
      <Text style={[styles.txt, { color: c }]}>{DIFF_LABEL[difficulty]}</Text>
    </View>
  );
}

export function RewardPill({ difficulty }: { difficulty: Difficulty }) {
  return (
    <View style={[styles.pill, { borderColor: T.accent + '55', backgroundColor: T.accent + '18' }]}>
      <Text style={[styles.txt, { color: T.accent }]}>{sparksForDifficulty(difficulty)} ✦</Text>
    </View>
  );
}

export function FilterPill({
  label,
  active,
  tone = T.accent,
  onPress,
  style,
}: {
  label: string;
  active?: boolean;
  tone?: string;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.pill,
        {
          borderColor: active ? tone : T.line,
          backgroundColor: active ? tone + '22' : 'transparent',
        },
        style,
      ]}
    >
      <Text style={[styles.txt, { color: active ? tone : T.soft }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  txt: {
    fontFamily: T.fMono,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
