import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useParentStore, ParentNotif } from '../../store/useParentStore';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';

const TYPE_COLORS: Record<ParentNotif['type'], string> = {
  hw_done: '#34d399',
  hw_due: '#fbbf24',
  event: '#a78bfa',
  streak: '#ec4899',
  points: '#06d6e0',
};

const TYPE_ICONS: Record<ParentNotif['type'], string> = {
  hw_done: '✓',
  hw_due: '⏰',
  event: '📅',
  streak: '🔥',
  points: '★',
};

export default function ParentActivityScreen({ navigation }: any) {
  const notifications = useParentStore((s) => s.notifications);
  const markAllNotifsRead = useParentStore((s) => s.markAllNotifsRead);
  const clearAllNotifications = useParentStore((s) => s.clearAllNotifications);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);

  // Mark everything read as soon as the screen opens
  useEffect(() => {
    markAllNotifsRead();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={[styles.backText, { fontFamily: theme.fMono, color: theme.accent }]}>← back</Text>
        </TouchableOpacity>
        <View style={styles.headlineRow}>
          <Text style={[styles.headline, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Activity.</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAllNotifications} style={[styles.clearBtn, { borderColor: theme.line }]}>
              <Text style={[styles.clearBtnText, { fontFamily: theme.fMono, color: theme.soft }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { fontFamily: theme.fDisplayItalic, color: theme.soft }]}>
              All clear.
            </Text>
            <Text style={[styles.emptySub, { fontFamily: theme.fMono, color: theme.soft }]}>
              No activity yet.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = TYPE_COLORS[item.type];
          const icon = TYPE_ICONS[item.type];
          return (
            <View
              style={[
                styles.notifRow,
                { backgroundColor: theme.surface, borderColor: theme.line },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
                <Text style={styles.icon}>{icon}</Text>
              </View>
              <View style={styles.notifInfo}>
                <Text style={[styles.notifText, { fontFamily: theme.fBody, color: theme.ink }]}>
                  {item.text}
                </Text>
                <Text style={[styles.notifTime, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {item.time}
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
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 4 },
  back: {},
  backText: { fontSize: 13, letterSpacing: 0.5 },
  headlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headline: { fontSize: 32, lineHeight: 38 },
  clearBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText: { fontSize: 11, letterSpacing: 0.5 },
  listContent: { padding: 16, gap: 10 },
  emptyWrap: { paddingTop: 60, alignItems: 'center', gap: 6 },
  emptyText: { fontSize: 28 },
  emptySub: { fontSize: 12, letterSpacing: 1 },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 16 },
  notifInfo: { flex: 1, gap: 3 },
  notifText: { fontSize: 14, lineHeight: 20 },
  notifTime: { fontSize: 11, letterSpacing: 0.5 },
});
