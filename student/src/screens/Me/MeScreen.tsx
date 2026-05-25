import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme, Vibe } from '../../theme';
import MicroLabel from '../../components/MicroLabel';
import { supabase } from '../../lib/supabase';

const VIBES: { id: Vibe; label: string; emoji: string; bg: string; card: string; dot1: string; dot2: string; dot3: string; textColor: string }[] = [
  {
    id: 'twilight', label: 'Space', emoji: '🌌',
    bg: '#0c0820', card: 'rgba(255,255,255,0.07)',
    dot1: '#ec4899', dot2: '#a78bfa', dot3: '#06d6e0',
    textColor: '#f4ecff',
  },
  {
    id: 'clay', label: 'Clay', emoji: '🧱',
    bg: '#e8d5ff', card: 'rgba(255,255,255,0.85)',
    dot1: '#ec4899', dot2: '#a78bfa', dot3: '#06d6e0',
    textColor: '#2d1b69',
  },
  {
    id: 'paper', label: 'Paper', emoji: '📄',
    bg: '#f3eee3', card: 'rgba(255,255,255,0.7)',
    dot1: '#ec4899', dot2: '#d97706', dot3: '#3d6b41',
    textColor: '#1c1917',
  },
];

export default function MeScreen({ navigation }: any) {
  const points = useStore((s) => s.points);
  const streak = useStore((s) => s.streak);
  const vibe = useStore((s) => s.vibe);
  const darkMode = useStore((s) => s.darkMode);
  const setVibe = useStore((s) => s.setVibe);
  const setDarkMode = useStore((s) => s.setDarkMode);
  const setPhase = useStore((s) => s.setPhase);
  const school = useStore((s) => s.school);
  const setSchool = useStore((s) => s.setSchool);
  const classes = useStore((s) => s.classes);
  const pairingCode = useStore((s) => s.pairingCode);
  const theme = makeTheme(vibe, darkMode);

  const [email, setEmail] = useState('');
  const [editingSchool, setEditingSchool] = useState(false);
  const [editingCity, setEditingCity] = useState(false);
  const [draftSchoolName, setDraftSchoolName] = useState(school.name);
  const [draftSchoolCity, setDraftSchoolCity] = useState(school.city);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  function saveSchool() {
    setSchool({ name: draftSchoolName.trim() || school.name, city: school.city });
    setEditingSchool(false);
  }

  function saveCity() {
    setSchool({ name: school.name, city: draftSchoolCity.trim() || school.city });
    setEditingCity(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setPhase('auth');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <LinearGradient
          colors={theme.accentGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileAvatar}>
            <Text style={[styles.profileInitial, { fontFamily: theme.fDisplayItalic }]}>N</Text>
          </View>
          <Text style={[styles.profileName, { fontFamily: theme.fBodySemiBold, color: '#fff' }]}>Noah</Text>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { fontFamily: theme.fMono, color: '#fff' }]}>{points.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: 'rgba(255,255,255,0.7)' }]}>PTS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { fontFamily: theme.fMono, color: '#fff' }]}>{streak}</Text>
              <Text style={[styles.statLabel, { fontFamily: theme.fMono, color: 'rgba(255,255,255,0.7)' }]}>DAY STREAK</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Account info */}
        <View style={styles.section}>
          <MicroLabel>Account</MicroLabel>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            {email !== '' && (
              <View style={[styles.infoRow, { borderBottomColor: theme.line }]}>
                <Text style={[styles.infoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>EMAIL</Text>
                <Text style={[styles.infoValue, { fontFamily: theme.fBody, color: theme.ink }]} numberOfLines={1}>{email}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.infoRow, { borderBottomColor: theme.line }]}
              onPress={() => setEditingSchool(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>SCHOOL</Text>
              {editingSchool ? (
                <TextInput
                  style={[styles.infoValueInput, { fontFamily: theme.fBody, color: theme.ink, borderColor: theme.accent }]}
                  value={draftSchoolName}
                  onChangeText={setDraftSchoolName}
                  onBlur={saveSchool}
                  onSubmitEditing={saveSchool}
                  autoFocus
                  returnKeyType="done"
                />
              ) : (
                <View style={styles.infoValueRow}>
                  <Text style={[styles.infoValue, { fontFamily: theme.fBody, color: theme.ink }]}>{school.name}</Text>
                  <Text style={[styles.editPencil, { color: theme.soft }]}>✎</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.infoRow, { borderBottomColor: theme.line }]}
              onPress={() => setEditingCity(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>CITY</Text>
              {editingCity ? (
                <TextInput
                  style={[styles.infoValueInput, { fontFamily: theme.fBody, color: theme.ink, borderColor: theme.accent }]}
                  value={draftSchoolCity}
                  onChangeText={setDraftSchoolCity}
                  onBlur={saveCity}
                  onSubmitEditing={saveCity}
                  autoFocus
                  returnKeyType="done"
                />
              ) : (
                <View style={styles.infoValueRow}>
                  <Text style={[styles.infoValue, { fontFamily: theme.fBody, color: theme.ink }]}>{school.city}</Text>
                  <Text style={[styles.editPencil, { color: theme.soft }]}>✎</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={[styles.infoRow, { borderBottomColor: 'transparent' }]}>
              <Text style={[styles.infoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>PAIRING CODE</Text>
              <Text style={[styles.infoValue, { fontFamily: theme.fMono, color: theme.accent, letterSpacing: 3 }]}>{pairingCode}</Text>
            </View>
          </View>
        </View>

        {/* Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MicroLabel>My Classes</MicroLabel>
            <TouchableOpacity onPress={() => setPhase('onboarding')}>
              <Text style={[styles.editLink, { fontFamily: theme.fMono, color: theme.accent }]}>Edit schedule →</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            {classes.length === 0 ? (
              <View style={styles.emptyClasses}>
                <Text style={[styles.emptyClassesText, { fontFamily: theme.fBody, color: theme.soft }]}>
                  No classes set up yet.
                </Text>
              </View>
            ) : (
              classes.map((cls, i) => (
                <View
                  key={cls.id}
                  style={[styles.classRow, { borderBottomColor: theme.line, borderBottomWidth: i < classes.length - 1 ? StyleSheet.hairlineWidth : 0 }]}
                >
                  <View style={[styles.classDot, { backgroundColor: cls.color }]} />
                  <View style={styles.classText}>
                    <Text style={[styles.className, { fontFamily: theme.fBody, color: theme.ink }]}>{cls.name}</Text>
                    {cls.teacher && (
                      <Text style={[styles.classTeacher, { fontFamily: theme.fMono, color: theme.soft }]}>{cls.teacher}</Text>
                    )}
                  </View>
                  <Text style={[styles.classTime, { fontFamily: theme.fMono, color: theme.sub }]}>
                    {cls.start}–{cls.end}
                  </Text>
                </View>
              ))
            )}
          </View>
          <Text style={[styles.editHint, { fontFamily: theme.fMono, color: theme.soft }]}>
            Tap "Edit schedule" at the start of a new semester to update your classes.
          </Text>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <MicroLabel>Theme</MicroLabel>
          <View style={styles.vibeRow}>
            {VIBES.map((v) => {
              const active = vibe === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vibeCard, { backgroundColor: v.bg, borderColor: active ? theme.accent : 'transparent', borderWidth: active ? 2.5 : 1.5 }]}
                  onPress={() => setVibe(v.id)}
                  activeOpacity={0.8}
                >
                  {/* Mini screen preview */}
                  <View style={[styles.vibePreview, { backgroundColor: v.card, borderColor: 'rgba(255,255,255,0.2)' }]}>
                    <View style={[styles.vibeBar, { backgroundColor: v.dot1 + 'cc' }]} />
                    <View style={[styles.vibeBar, { backgroundColor: v.dot2 + 'cc', width: '70%' }]} />
                    <View style={[styles.vibeBar, { backgroundColor: v.dot3 + 'cc', width: '50%' }]} />
                  </View>
                  <View style={styles.vibeMeta}>
                    <Text style={styles.vibeEmoji}>{v.emoji}</Text>
                    <Text style={[styles.vibeLabel, { fontFamily: theme.fMono, color: v.textColor }]}>{v.label}</Text>
                  </View>
                  {active && (
                    <View style={[styles.vibeCheck, { backgroundColor: theme.accent }]}>
                      <Text style={styles.vibeCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {!theme.isClay && (
            <View style={[styles.settingRow, { borderColor: theme.line, backgroundColor: theme.surface }]}>
              <Text style={[styles.settingLabel, { fontFamily: theme.fBody, color: theme.ink }]}>Dark mode</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: theme.line, true: theme.accent + '88' }}
                thumbColor={darkMode ? theme.accent : theme.soft}
              />
            </View>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={[styles.signOut, { borderColor: theme.red + '55' }]} onPress={handleSignOut}>
          <Text style={[styles.signOutText, { fontFamily: theme.fMono, color: theme.red }]}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 48 },
  profileCard: {
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    gap: 8,
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { fontSize: 11, letterSpacing: 0.5 },
  infoCard: {
    borderRadius: 34,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  infoLabel: { fontSize: 10, letterSpacing: 1, flexShrink: 0 },
  infoValue: { fontSize: 14, textAlign: 'right', flex: 1 },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  classDot: { width: 10, height: 10, borderRadius: 28, flexShrink: 0 },
  classText: { flex: 1 },
  className: { fontSize: 15 },
  classTeacher: { fontSize: 11, letterSpacing: 0.3, marginTop: 1 },
  classTime: { fontSize: 11, letterSpacing: 0.3 },
  emptyClasses: { padding: 16 },
  emptyClassesText: { fontSize: 14 },
  editHint: { fontSize: 11, letterSpacing: 0.3, paddingHorizontal: 4 },
  vibeRow: { flexDirection: 'row', gap: 10 },
  vibeCard: {
    flex: 1,
    borderRadius: 28,
    padding: 12,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  vibePreview: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 8,
    gap: 5,
  },
  vibeBar: { height: 8, borderRadius: 34, width: '100%' },
  vibeMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  vibeEmoji: { fontSize: 14 },
  vibeCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  vibeCheckText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  vibeOption: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  vibeDot: { width: 10, height: 10, borderRadius: 28 },
  vibeLabel: { fontSize: 10, letterSpacing: 0.5, fontWeight: '700' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 34,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: { fontSize: 15 },
  signOut: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  signOutText: { fontSize: 13, letterSpacing: 1.5 },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  editPencil: { fontSize: 13 },
  infoValueInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    borderBottomWidth: 1.5,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
});
