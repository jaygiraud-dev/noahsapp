import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { T } from '../theme';
import { todayKey, multiplierFor, multiplierLabel } from '../economy';
import ShineCard from './ShineCard';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Monday-anchored dates for the current week.
function weekDates(): string[] {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return todayKey(d);
  });
}

export default function StreakCard() {
  const streak = useStore((s) => s.streak);
  const days = useStore((s) => s.days);
  const userQuests = useStore((s) => s.userQuests);

  const today = todayKey();
  const week = weekDates();
  const activeByDay = new Set(days.filter((d) => d.points > 0 || d.questUids.length > 0).map((d) => d.key));
  const tasksLeft = userQuests.filter((u) => u.status === 'active').length;
  const mult = multiplierFor(streak);

  return (
    <ShineCard style={styles.card} glow={T.accent}>
      <View style={styles.top}>
        <View>
          <Text style={styles.tasksLeft}>
            {tasksLeft === 0 ? 'All clear for today ✦' : `Just ${tasksLeft} ${tasksLeft === 1 ? 'quest' : 'quests'} left for today!`}
          </Text>
          <Text style={styles.streakSub}>
            {streak === 0 ? 'Start your streak today' : `${streak} day streak`}
          </Text>
        </View>
        <View style={styles.multiBadge}>
          <LinearGradient colors={T.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.multiGrad}>
            <Text style={styles.multiTxt}>{multiplierLabel(mult)}</Text>
          </LinearGradient>
        </View>
      </View>
      <View style={styles.week}>
        {week.map((key, i) => {
          const done = activeByDay.has(key);
          const isToday = key === today;
          return (
            <View key={key} style={styles.dayCol}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  isToday && !done && styles.dotToday,
                ]}
              >
                {done ? (
                  <Text style={styles.dotCheck}>✦</Text>
                ) : (
                  <Text style={[styles.dotLabel, isToday && { color: T.accent }]}>{DOW[i]}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ShineCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tasksLeft: { fontFamily: T.fSemi, fontSize: 16, color: T.ink, maxWidth: 230 },
  streakSub: { fontFamily: T.fMono, fontSize: 12, color: T.sub, marginTop: 5, letterSpacing: 0.3 },
  multiBadge: { borderRadius: 14, overflow: 'hidden' },
  multiGrad: { paddingHorizontal: 12, paddingVertical: 7 },
  multiTxt: { fontFamily: T.fMonoB, fontSize: 16, color: '#fff' },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  dayCol: { alignItems: 'center', flex: 1 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: T.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotDone: { backgroundColor: T.accent, borderColor: T.accent },
  dotToday: { borderColor: T.accent },
  dotLabel: { fontFamily: T.fMed, fontSize: 12, color: T.soft },
  dotCheck: { fontSize: 14, color: '#fff' },
});
