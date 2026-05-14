import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useParentStore, ParentNotif } from '../store/useParentStore';
import { makeTheme } from '../theme';

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

export default function ActivityScreen({ navigation }: any) {
  const notifications = useParentStore((s) => s.notifications);
  const markNotifRead = useParentStore((s) => s.markNotifRead);
  const theme = makeTheme('twilight', true);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={[styles.backText, { fontFamily: theme.fMono, color: theme.accent }]}>
            ← back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headline, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
          Activity.
        </Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const color = TYPE_COLORS[item.type];
          const icon = TYPE_ICONS[item.type];
          return (
            <TouchableOpacity
              style={[
                styles.notifRow,
                { backgroundColor: theme.surface, borderColor: item.read ? theme.line : color + '44' },
              ]}
              onPress={() => markNotifRead(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
                <Text style={styles.icon}>{icon}</Text>
              </View>
              <View style={styles.notifInfo}>
                <Text style={[
                  styles.notifText,
                  { fontFamily: theme.fBody, color: item.read ? theme.sub : theme.ink },
                ]}>
                  {item.text}
                </Text>
                <Text style={[styles.notifTime, { fontFamily: theme.fMono, color: theme.soft }]}>
                  {item.time}
                </Text>
              </View>
              {!item.read && (
                <View style={[styles.unreadDot, { backgroundColor: color }]} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  back: {},
  backText: { fontSize: 13, letterSpacing: 0.5 },
  headline: { fontSize: 32, lineHeight: 38 },
  listContent: { padding: 16, gap: 10 },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 16 },
  notifInfo: { flex: 1, gap: 3 },
  notifText: { fontSize: 14, lineHeight: 20 },
  notifTime: { fontSize: 11, letterSpacing: 0.5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
