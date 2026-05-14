import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useParentStore, LinkedKid } from '../../store/useParentStore';
import { useStore } from '../../store/useStore';
import { makeTheme } from '../../theme';
import { supabase } from '../../lib/supabase';

function KidCard({ kid, theme, onViewActivity }: { kid: LinkedKid; theme: ReturnType<typeof makeTheme>; onViewActivity: () => void }) {
  const hwPct = kid.homeworkDue > 0 ? (kid.homeworkDone / kid.homeworkDue) * 100 : 0;

  return (
    <View style={[styles.kidCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.kidHeader}>
        <LinearGradient
          colors={theme.accentGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.kidAvatar}
        >
          <Text style={[styles.kidInitial, { fontFamily: theme.fDisplayItalic }]}>
            {kid.name[0]}
          </Text>
        </LinearGradient>
        <View style={styles.kidInfo}>
          <Text style={[styles.kidName, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>
            {kid.name}
          </Text>
          <Text style={[styles.kidSchool, { fontFamily: theme.fMono, color: theme.soft }]}>
            {kid.school}  ·  {kid.grade}
          </Text>
          <Text style={[styles.kidActive, { fontFamily: theme.fMono, color: theme.sub }]}>
            Active {kid.lastActive}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.accent }]}>
            {kid.points}
          </Text>
          <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>pts</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { fontFamily: theme.fMono, color: theme.amber }]}>
            {kid.streak}🔥
          </Text>
          <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>streak</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.line }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { fontFamily: theme.fMono, color: kid.eventsToday > 0 ? theme.purple : theme.soft }]}>
            {kid.eventsToday}
          </Text>
          <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: theme.soft }]}>events</Text>
        </View>
      </View>

      <View style={styles.hwSection}>
        <View style={styles.hwLabelRow}>
          <Text style={[styles.hwLabel, { fontFamily: theme.fMono, color: theme.sub }]}>HOMEWORK</Text>
          <Text style={[styles.hwCount, { fontFamily: theme.fMono, color: theme.soft }]}>
            {kid.homeworkDone}/{kid.homeworkDue} done
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceHi }]}>
          <LinearGradient
            colors={theme.accentGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${hwPct}%` as any }]}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.activityBtn, { borderColor: theme.accent }]}
        onPress={onViewActivity}
      >
        <Text style={[styles.activityBtnText, { fontFamily: theme.fMono, color: theme.accent }]}>
          View activity →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ParentDashboardScreen({ navigation }: any) {
  const linkedKids = useParentStore((s) => s.linkedKids);
  const notifications = useParentStore((s) => s.notifications);
  const setPhase = useStore((s) => s.setPhase);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const theme = makeTheme(vibe, darkMode);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.appName, { fontFamily: theme.fMono, color: theme.soft }]}>
            my agenda
          </Text>
          <Text style={[styles.headline, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
            Dashboard.
          </Text>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
            onPress={() => navigation.navigate('ParentActivity')}
          >
            <Text style={[styles.notifIcon, { color: unreadCount > 0 ? theme.magenta : theme.soft }]}>
              🔔
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: theme.magenta }]}>
                <Text style={[styles.notifBadgeText, { fontFamily: theme.fMono }]}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => { await supabase.auth.signOut(); setPhase('auth'); }}>
            <Text style={[styles.signOut, { fontFamily: theme.fMono, color: theme.soft }]}>sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {linkedKids.map((kid) => (
          <KidCard
            key={kid.id}
            kid={kid}
            theme={theme}
            onViewActivity={() => navigation.navigate('ParentActivity')}
          />
        ))}

        {linkedKids.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyIcon, { color: theme.soft }]}>👀</Text>
            <Text style={[styles.emptyText, { fontFamily: theme.fDisplayItalic, color: theme.sub }]}>
              No kids linked yet.
            </Text>
            <Text style={[styles.emptyHint, { fontFamily: theme.fBody, color: theme.soft }]}>
              Ask your child for their 6-digit pairing code from the app.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  appName: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  headline: { fontSize: 32, lineHeight: 38 },
  topRight: { alignItems: 'flex-end', gap: 8 },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifIcon: { fontSize: 20 },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: { color: '#fff', fontSize: 10 },
  signOut: { fontSize: 11, letterSpacing: 1 },
  content: { padding: 16, gap: 16 },
  kidCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  kidHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  kidAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kidInitial: { fontSize: 28, color: '#fff' },
  kidInfo: { flex: 1, gap: 2 },
  kidName: { fontSize: 18 },
  kidSchool: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  kidActive: { fontSize: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 20, letterSpacing: 0.5 },
  statLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 32 },
  hwSection: { gap: 8 },
  hwLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  hwLabel: { fontSize: 10, letterSpacing: 1 },
  hwCount: { fontSize: 10, letterSpacing: 0.5 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  activityBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activityBtnText: { fontSize: 13, letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 22 },
  emptyHint: { fontSize: 14, textAlign: 'center' },
});
