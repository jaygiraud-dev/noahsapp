import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';
import ShineCard from '../../components/ShineCard';
import Avatar from '../../components/Avatar';
import AddFriendSheet from '../sheets/AddFriendSheet';
import { confirmAction } from '../../lib/confirm';
import { effectiveStreak } from '../../lib/time';

interface Row { id: string; name: string; sub: string; pts: number; streak: number; avatar?: string | null; color: string; isMe: boolean }

export default function SquadScreen() {
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const friends = useStore((s) => s.friends);
  const loadFriends = useStore((s) => s.loadFriends);
  const removeFriend = useStore((s) => s.removeFriend);
  const userId = useStore((s) => s.userId);
  const displayName = useStore((s) => s.displayName);
  const avatar = useStore((s) => s.avatar);
  const points = useStore((s) => s.points);
  const streak = useStore((s) => s.streak);
  const lastActivityDate = useStore((s) => s.lastActivityDate);
  const school = useStore((s) => s.school);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const bgImageUri = useStore((s) => s.bgImageUri);
  const theme = makeTheme(vibe, darkMode);
  const hasBg = bgImageUri !== '';
  const cardSurface = hasBg ? 'rgba(20,20,20,0.78)' : theme.surface;

  useEffect(() => { loadFriends(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  }, []);

  const rows: Row[] = [
    { id: 'me', name: `${displayName} (you)`, sub: school.name, pts: points, streak: effectiveStreak(streak, lastActivityDate), avatar, color: theme.accent, isMe: true },
    ...friends.map((f) => ({ id: f.id, name: f.name, sub: [f.school, f.grade ? `Grade ${f.grade}` : ''].filter(Boolean).join(' · '), pts: f.pts, streak: f.streak, avatar: f.avatar, color: f.color, isMe: false })),
  ].sort((a, b) => b.pts - a.pts);

  function confirmRemove(r: Row) {
    confirmAction('Remove friend?', `${r.name} will be removed from your squad, and you from theirs.`, 'Remove', () => removeFriend(r.id));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: hasBg ? 'transparent' : theme.bg }]} edges={['top']}>
      {!hasBg && <LinearGradient colors={[theme.accent + '38', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.65 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
      {hasBg && (
        <ImageBackground source={{ uri: bgImageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover">
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />
        </ImageBackground>
      )}
      <View style={styles.header}>
        <SerifTitle size={40}>squad.</SerifTitle>
        <TouchableOpacity style={[styles.addFriendBtn, { borderColor: theme.accent }]} onPress={() => setShowAddFriend(true)}>
          <Text style={[styles.addFriendText, { fontFamily: theme.fMono, color: theme.accent }]}>+ friend</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}>
        <MicroLabel>Leaderboard · points</MicroLabel>
        {rows.map((r, i) => (
          <ShineCard key={r.id} style={[styles.row, { backgroundColor: cardSurface, borderColor: r.isMe ? theme.accent : 'transparent', borderWidth: r.isMe ? 1 : 0 }]}>
            <Text style={[styles.rank, { fontFamily: theme.fMono, color: i === 0 ? theme.amber : theme.soft }]}>{i === 0 && rows.length > 1 ? '👑' : `#${i + 1}`}</Text>
            <Avatar uri={r.avatar} name={r.name} size={42} colors={[r.color, r.color + 'aa']} fontFamily={theme.fDisplayItalic} />
            <View style={styles.info}>
              <Text style={[styles.name, { fontFamily: theme.fBodyMedium, color: theme.ink }]} numberOfLines={1}>{r.name}</Text>
              {r.sub !== '' && <Text style={[styles.sub, { fontFamily: theme.fMono, color: theme.soft }]} numberOfLines={1}>{r.sub}</Text>}
            </View>
            <View style={styles.stats}>
              <Text style={[styles.pts, { fontFamily: theme.fMono, color: theme.ink }]}>{r.pts.toLocaleString()}</Text>
              <Text style={[styles.streak, { fontFamily: theme.fMono, color: r.streak > 0 ? theme.amber : theme.soft }]}>🔥{r.streak}</Text>
            </View>
            {!r.isMe && (
              <TouchableOpacity onPress={() => confirmRemove(r)} style={styles.removeBtn} accessibilityLabel={`Remove ${r.name}`}>
                <Text style={[styles.removeText, { color: theme.soft }]}>×</Text>
              </TouchableOpacity>
            )}
          </ShineCard>
        ))}

        {friends.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👋</Text>
            <Text style={[styles.emptyTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Bring your friends.</Text>
            <Text style={[styles.emptySub, { fontFamily: theme.fBody, color: theme.soft }]}>
              {userId
                ? 'Swap codes with a friend. Once one of you adds the other, you both show up here and race for points.'
                : 'Create an account to add friends.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <AddFriendSheet visible={showAddFriend} onClose={() => setShowAddFriend(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addFriendBtn: { borderRadius: 100, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  addFriendText: { fontSize: 12, letterSpacing: 0.5 },
  listContent: { paddingHorizontal: 16, paddingBottom: 110, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 12, gap: 12 },
  rank: { width: 28, fontSize: 13, textAlign: 'center' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15 },
  sub: { fontSize: 10, letterSpacing: 0.3 },
  stats: { alignItems: 'flex-end', gap: 2 },
  pts: { fontSize: 15 },
  streak: { fontSize: 11 },
  removeBtn: { paddingHorizontal: 4 },
  removeText: { fontSize: 20 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 22 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24, maxWidth: 420 },
});
