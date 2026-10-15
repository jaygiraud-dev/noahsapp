import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useParentStore } from '../../store/useParentStore';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { useParentData } from '../../lib/parentData';
import { ActivityItem } from '../../types';
import { isSameDay, relativeTime } from '../../lib/time';

const ICONS: Record<string, string> = { hw_done: '✓', hw_added: '📝', event_added: '📅', streak: '🔥' };

function dayHeading(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (isSameDay(d, now)) return 'Today';
  if (isSameDay(d, y)) return 'Yesterday';
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Everything linked kids have done in the app, newest first. */
export default function ParentActivityScreen({ navigation }: any) {
  const { activity, kids, loadActivity } = useParentData();
  const markActivitySeen = useParentStore((s) => s.markActivitySeen);
  const clearActivity = useParentStore((s) => s.clearActivity);
  const clearedBefore = useParentStore((s) => s.clearedBefore);
  const lastSeenOnOpen = useState(useParentStore.getState().lastSeenActivityAt)[0];
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadActivity(); markActivitySeen(); }, []);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadActivity(); setRefreshing(false); }, []);

  const visible = activity.filter((a) => !clearedBefore || a.createdAt > clearedBefore);
  const nameOf = (id: string) => kids.find((k) => k.id === id)?.name ?? 'Your kid';
  const multipleKids = kids.length > 1;

  const sections: Array<{ title: string; data: ActivityItem[] }> = [];
  for (const a of visible) {
    const t = dayHeading(a.createdAt);
    const last = sections[sections.length - 1];
    if (last && last.title === t) last.data.push(a); else sections.push({ title: t, data: [a] });
  }

  const colorFor = (a: ActivityItem) => a.type === 'hw_done' ? theme.mint : a.type === 'streak' ? theme.amber : a.color ?? theme.accent;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { fontFamily: theme.fMono, color: theme.accent }]}>← dashboard</Text>
        </TouchableOpacity>
        <View style={styles.headlineRow}>
          <Text style={[styles.headline, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Activity.</Text>
          {visible.length > 0 && (
            <TouchableOpacity onPress={clearActivity} style={[styles.clearBtn, { borderColor: theme.line }]}>
              <Text style={[styles.clearBtnText, { fontFamily: theme.fMono, color: theme.soft }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.sub, { fontFamily: theme.fBody, color: theme.sub }]}>Homework added and finished, plans added and streaks, as they happen.</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.dayHead, { fontFamily: theme.fMono, color: theme.soft }]}>{section.title.toUpperCase()}</Text>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { fontFamily: theme.fDisplayItalic, color: theme.sub }]}>All quiet.</Text>
            <Text style={[styles.emptySub, { fontFamily: theme.fBody, color: theme.soft }]}>New homework, finished work and plans show up here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const c = colorFor(item);
          const isNew = !!lastSeenOnOpen ? item.createdAt > lastSeenOnOpen : false;
          return (
            <View style={[styles.row, { backgroundColor: theme.surface, borderColor: isNew ? theme.accent + '88' : 'transparent' }]}>
              <View style={[styles.iconWrap, { backgroundColor: c + '22' }]}>
                <Text style={[styles.icon, { color: c }]}>{ICONS[item.type] ?? '•'}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.text, { fontFamily: theme.fBody, color: theme.ink }]}>
                  {multipleKids && <Text style={{ fontFamily: theme.fBodySemiBold }}>{nameOf(item.studentId)}: </Text>}
                  {item.text}
                </Text>
                <Text style={[styles.time, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {[item.subject, relativeTime(item.createdAt)].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, gap: 4 },
  backText: { fontSize: 15, letterSpacing: 0.5 },
  headlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headline: { fontSize: 34, lineHeight: 40 },
  sub: { fontSize: 15, lineHeight: 21 },
  clearBtn: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText: { fontSize: 13, letterSpacing: 0.5 },
  listContent: { padding: 16, gap: 8, paddingBottom: 40 },
  dayHead: { fontSize: 12, letterSpacing: 1.2, marginTop: 10, marginBottom: 4 },
  emptyWrap: { paddingTop: 60, alignItems: 'center', gap: 6 },
  emptyText: { fontSize: 28 },
  emptySub: { fontSize: 15, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 12, gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 17 },
  info: { flex: 1, gap: 3 },
  text: { fontSize: 16, lineHeight: 22 },
  time: { fontSize: 13, letterSpacing: 0.3 },
});
