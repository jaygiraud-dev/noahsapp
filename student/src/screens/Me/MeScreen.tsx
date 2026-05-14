import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme, Vibe } from '../../theme';
import SerifTitle from '../../components/SerifTitle';
import MicroLabel from '../../components/MicroLabel';

const VIBES: { id: Vibe; label: string; accent: string }[] = [
  { id: 'twilight', label: 'Twilight', accent: '#a78bfa' },
  { id: 'paper', label: 'Paper', accent: '#d97706' },
  { id: 'mono', label: 'Mono', accent: '#22c55e' },
];

function NotifRow({ notif, theme }: any) {
  return (
    <View style={[styles.notifRow, { borderColor: theme.line }]}>
      <View
        style={[
          styles.notifDot,
          { backgroundColor: notif.type === 'hw' ? theme.accent : notif.type === 'friend' ? theme.magenta : theme.cyan },
        ]}
      />
      <View style={styles.notifInfo}>
        <Text style={[styles.notifText, { fontFamily: theme.fBody, color: theme.ink }]}>
          {notif.text}
        </Text>
        <Text style={[styles.notifTime, { fontFamily: theme.fMono, color: theme.soft }]}>
          {notif.time}
        </Text>
      </View>
    </View>
  );
}

export default function MeScreen() {
  const points = useStore((s) => s.points);
  const streak = useStore((s) => s.streak);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const setVibe = useStore((s) => s.setVibe);
  const setDarkMode = useStore((s) => s.setDarkMode);
  const notifications = useStore((s) => s.notifications);
  const setPhase = useStore((s) => s.setPhase);
  const theme = makeTheme(vibe, darkMode);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <LinearGradient
          colors={theme.accentGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileAvatar}>
            <Text style={[styles.profileInitial, { fontFamily: theme.fDisplayItalic }]}>N</Text>
          </View>
          <Text style={[styles.profileName, { fontFamily: theme.fBodySemiBold, color: '#fff' }]}>
            Noah
          </Text>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { fontFamily: theme.fMono, color: '#fff' }]}>{points}</Text>
              <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: 'rgba(255,255,255,0.7)' }]}>pts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { fontFamily: theme.fMono, color: '#fff' }]}>{streak}</Text>
              <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: 'rgba(255,255,255,0.7)' }]}>day streak</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Vibe picker */}
        <View style={styles.section}>
          <MicroLabel>Vibe</MicroLabel>
          <View style={styles.vibeRow}>
            {VIBES.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.vibeOption,
                  {
                    borderColor: vibe === v.id ? v.accent : theme.line,
                    backgroundColor: vibe === v.id ? v.accent + '22' : theme.surface,
                  },
                ]}
                onPress={() => setVibe(v.id)}
              >
                <View style={[styles.vibeDot, { backgroundColor: v.accent }]} />
                <Text style={[styles.vibeLabel, { fontFamily: theme.fMono, color: vibe === v.id ? v.accent : theme.sub }]}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dark mode */}
        <View style={[styles.settingRow, { borderColor: theme.line }]}>
          <Text style={[styles.settingLabel, { fontFamily: theme.fBody, color: theme.ink }]}>Dark mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: theme.line, true: theme.accent + '88' }}
            thumbColor={darkMode ? theme.accent : theme.soft}
          />
        </View>

        {/* Notifications */}
        {notifications.length > 0 && (
          <View style={styles.section}>
            <MicroLabel>Activity</MicroLabel>
            {notifications.slice(0, 5).map((n) => (
              <NotifRow key={n.id} notif={n} theme={theme} />
            ))}
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOut, { borderColor: theme.red + '55' }]}
          onPress={() => setPhase('auth')}
        >
          <Text style={[styles.signOutText, { fontFamily: theme.fMono, color: theme.red }]}>
            sign out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#a78bfa',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: { fontSize: 32, color: '#fff' },
  profileName: { fontSize: 20 },
  profileStats: { flexDirection: 'row', gap: 24, alignItems: 'center', marginTop: 4 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 22, letterSpacing: 0.5 },
  statLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  section: { gap: 10 },
  vibeRow: { flexDirection: 'row', gap: 10 },
  vibeOption: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  vibeDot: { width: 10, height: 10, borderRadius: 5 },
  vibeLabel: { fontSize: 10, letterSpacing: 0.5 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  settingLabel: { fontSize: 15 },
  notifRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
  },
  notifDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  notifInfo: { flex: 1, gap: 2 },
  notifText: { fontSize: 14, lineHeight: 20 },
  notifTime: { fontSize: 10, letterSpacing: 0.5 },
  signOut: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: { fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
});
