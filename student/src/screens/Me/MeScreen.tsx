import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { makeTheme, Vibe } from '../../theme';
import MicroLabel from '../../components/MicroLabel';
import { supabase } from '../../lib/supabase';

const VIBES: { id: Vibe; label: string; accent: string }[] = [
  { id: 'twilight', label: 'Twilight', accent: '#a78bfa' },
  { id: 'paper', label: 'Paper', accent: '#d97706' },
  { id: 'mono', label: 'Mono', accent: '#22c55e' },
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
  const [draftSchoolName, setDraftSchoolName] = useState(school.name);
  const [draftSchoolCity, setDraftSchoolCity] = useState(school.city);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  function openEditSchool() {
    setDraftSchoolName(school.name);
    setDraftSchoolCity(school.city);
    setEditingSchool(true);
  }

  function saveSchool() {
    setSchool({ name: draftSchoolName.trim() || school.name, city: draftSchoolCity.trim() || school.city });
    setEditingSchool(false);
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
          <View style={styles.sectionHeader}>
            <MicroLabel>Account</MicroLabel>
            <TouchableOpacity onPress={openEditSchool}>
              <Text style={[styles.editLink, { fontFamily: theme.fMono, color: theme.accent }]}>Edit school →</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            {email !== '' && (
              <View style={[styles.infoRow, { borderBottomColor: theme.line }]}>
                <Text style={[styles.infoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>EMAIL</Text>
                <Text style={[styles.infoValue, { fontFamily: theme.fBody, color: theme.ink }]} numberOfLines={1}>{email}</Text>
              </View>
            )}
            <View style={[styles.infoRow, { borderBottomColor: theme.line }]}>
              <Text style={[styles.infoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>SCHOOL</Text>
              <Text style={[styles.infoValue, { fontFamily: theme.fBody, color: theme.ink }]}>{school.name}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.line }]}>
              <Text style={[styles.infoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>CITY</Text>
              <Text style={[styles.infoValue, { fontFamily: theme.fBody, color: theme.ink }]}>{school.city}</Text>
            </View>
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
          <MicroLabel>Appearance</MicroLabel>
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
          <View style={[styles.settingRow, { borderColor: theme.line, backgroundColor: theme.surface }]}>
            <Text style={[styles.settingLabel, { fontFamily: theme.fBody, color: theme.ink }]}>Dark mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: theme.line, true: theme.accent + '88' }}
              thumbColor={darkMode ? theme.accent : theme.soft}
            />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={[styles.signOut, { borderColor: theme.red + '55' }]} onPress={handleSignOut}>
          <Text style={[styles.signOutText, { fontFamily: theme.fMono, color: theme.red }]}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit school modal */}
      <Modal visible={editingSchool} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditingSchool(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.editModal, { backgroundColor: theme.bg }]}
        >
          <View style={[styles.modalHandle, { backgroundColor: theme.line }]} />
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={[styles.editModalTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Edit school.</Text>
              <TouchableOpacity onPress={() => setEditingSchool(false)}>
                <Text style={[styles.editModalClose, { color: theme.soft }]}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldGroup}>
              <MicroLabel>School Name</MicroLabel>
              <TextInput
                style={[styles.editInput, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
                value={draftSchoolName}
                onChangeText={setDraftSchoolName}
                placeholder="e.g. Sutherland Secondary"
                placeholderTextColor={theme.soft}
                autoFocus
              />
            </View>
            <View style={styles.fieldGroup}>
              <MicroLabel>City</MicroLabel>
              <TextInput
                style={[styles.editInput, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink, fontFamily: theme.fBody }]}
                value={draftSchoolCity}
                onChangeText={setDraftSchoolCity}
                placeholder="e.g. North Vancouver"
                placeholderTextColor={theme.soft}
              />
            </View>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={saveSchool}>
              <Text style={[styles.saveBtnText, { fontFamily: theme.fMono }]}>Save changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 48 },
  profileCard: {
    borderRadius: 20,
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
    borderRadius: 14,
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
  classDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  classText: { flex: 1 },
  className: { fontSize: 15 },
  classTeacher: { fontSize: 11, letterSpacing: 0.3, marginTop: 1 },
  classTime: { fontSize: 11, letterSpacing: 0.3 },
  emptyClasses: { padding: 16 },
  emptyClassesText: { fontSize: 14 },
  editHint: { fontSize: 11, letterSpacing: 0.3, paddingHorizontal: 4 },
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
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: { fontSize: 15 },
  signOut: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  signOutText: { fontSize: 13, letterSpacing: 1.5 },
  editModal: { flex: 1 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  editModalContent: { padding: 20, gap: 20 },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editModalTitle: { fontSize: 26 },
  editModalClose: { fontSize: 28, lineHeight: 32 },
  fieldGroup: { gap: 8 },
  editInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
  },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, letterSpacing: 0.5 },
});
