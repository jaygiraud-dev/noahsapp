import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import ShineCard from '../../components/ShineCard';
import { useStore } from '../../store/useStore';
import { makeTheme, Vibe } from '../../theme';
import MicroLabel from '../../components/MicroLabel';
import { supabase } from '../../lib/supabase';
import { upsertProfile } from '../../lib/db';

const VIBES: { id: Vibe; label: string; emoji: string; bg: string; card: string; dot1: string; dot2: string; dot3: string; textColor: string }[] = [
  {
    id: 'twilight', label: 'Aura', emoji: '🔥',
    bg: '#0d0d0d', card: '#1c1c1c',
    dot1: '#e8453a', dot2: '#f5a623', dot3: '#f0c040',
    textColor: '#f5f0eb',
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
  const parentPaired = useStore((s) => s.parentPaired);
  const setParentPaired = useStore((s) => s.setParentPaired);
  const userId = useStore((s) => s.userId);
  const bgImageUri = useStore((s) => s.bgImageUri);
  const setBgImageUri = useStore((s) => s.setBgImageUri);
  const theme = makeTheme(vibe, darkMode);

  const [email, setEmail] = useState('');
  const displayName = email ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Student';
  const initial = displayName.charAt(0).toUpperCase();
  const [editingSchool, setEditingSchool] = useState(false);
  const [editingCity, setEditingCity] = useState(false);
  const [draftSchoolName, setDraftSchoolName] = useState(school.name);
  const [draftSchoolCity, setDraftSchoolCity] = useState(school.city);

  // Security & Privacy state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Disconnect parent state
  const [disconnected, setDisconnected] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  function handleCopyCode() {
    Clipboard.setString(pairingCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      if (data.user.email) setEmail(data.user.email);
      // Always sync current pairing code to Supabase so the parent lookup works
      const name = data.user.email?.split('@')[0] ?? 'Student';
      upsertProfile(data.user.id, 'student', pairingCode, school.name, name).catch(() => {});
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

  async function handleSavePassword() {
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPasswordSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordForm(false);
    }, 2000);
  }

  async function handlePickBgImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setBgImageUri(result.assets[0].uri);
    }
  }

  function handleDisconnectParent() {
    Alert.alert(
      'Disconnect parent',
      'Are you sure? Your parent will no longer be able to see your activity.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setParentPaired(false);
            if (userId) {
              await supabase
                .from('parent_student_links')
                .delete()
                .eq('student_id', userId);
            }
            setDisconnected(true);
            setTimeout(() => setDisconnected(false), 2000);
          },
        },
      ]
    );
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
            <Text style={[styles.profileInitial, { fontFamily: theme.fDisplayItalic }]}>{initial}</Text>
          </View>
          <Text style={[styles.profileName, { fontFamily: theme.fBodySemiBold, color: '#fff' }]}>{displayName}</Text>
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
          <ShineCard style={[styles.infoCard, { backgroundColor: theme.surface }]}>
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
          </ShineCard>
        </View>

        {/* Pair with Parent */}
        <View style={styles.section}>
          <MicroLabel>Pair with Parent</MicroLabel>
          <ShineCard style={[styles.pairCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.pairHint, { fontFamily: theme.fBody, color: theme.sub }]}>
              Give this code to your parent. They enter it in the parent app under Dashboard → Link a student.
            </Text>
            <TouchableOpacity style={[styles.codeBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '55' }]} onPress={handleCopyCode} activeOpacity={0.7}>
              <Text style={[styles.codeText, { fontFamily: theme.fMono, color: theme.accent }]}>{pairingCode}</Text>
              <Text style={[styles.copyBtn, { fontFamily: theme.fMono, color: codeCopied ? theme.mint : theme.accent }]}>
                {codeCopied ? '✓ copied' : 'tap to copy'}
              </Text>
            </TouchableOpacity>
          </ShineCard>
        </View>

        {/* Security & Privacy */}
        <View style={styles.section}>
          <MicroLabel>Security &amp; Privacy</MicroLabel>
          <ShineCard style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            {/* Change password row */}
            <TouchableOpacity
              style={[styles.infoRow, { borderBottomColor: theme.line, flexDirection: 'column', alignItems: 'stretch' }]}
              onPress={() => { if (!showPasswordForm) { setShowPasswordForm(true); setPasswordError(''); setPasswordSuccess(false); } }}
              activeOpacity={showPasswordForm ? 1 : 0.7}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.infoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>CHANGE PASSWORD</Text>
                {!showPasswordForm && (
                  <Text style={[styles.editPencil, { color: theme.soft }]}>›</Text>
                )}
                {passwordSuccess && (
                  <Text style={[{ fontFamily: theme.fMono, fontSize: 11, color: '#34d399' }]}>Password updated ✓</Text>
                )}
              </View>
              {showPasswordForm && !passwordSuccess && (
                <View style={{ marginTop: 12, gap: 10 }}>
                  <TextInput
                    style={[styles.secureInput, { fontFamily: theme.fBody, color: theme.ink, borderColor: theme.line, backgroundColor: theme.bg }]}
                    placeholder="New password"
                    placeholderTextColor={theme.soft}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoFocus
                  />
                  <TextInput
                    style={[styles.secureInput, { fontFamily: theme.fBody, color: theme.ink, borderColor: theme.line, backgroundColor: theme.bg }]}
                    placeholder="Confirm password"
                    placeholderTextColor={theme.soft}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  {passwordError !== '' && (
                    <Text style={[{ fontFamily: theme.fMono, fontSize: 11, color: theme.red }]}>{passwordError}</Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[styles.pwBtn, { backgroundColor: theme.accent, flex: 1 }]}
                      onPress={handleSavePassword}
                      disabled={savingPassword}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pwBtnText, { fontFamily: theme.fMono, color: '#fff' }]}>
                        {savingPassword ? 'Saving…' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pwBtn, { borderWidth: 1, borderColor: theme.line, flex: 1 }]}
                      onPress={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pwBtnText, { fontFamily: theme.fMono, color: theme.soft }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Email row */}
            <View style={[styles.infoRow, { borderBottomColor: 'transparent' }]}>
              <Text style={[styles.infoLabel, { fontFamily: theme.fMono, color: theme.soft }]}>EMAIL</Text>
              <Text style={[styles.infoValue, { fontFamily: theme.fBody, color: theme.ink }]} numberOfLines={1}>{email}</Text>
            </View>
          </ShineCard>
        </View>

        {/* Disconnect parent */}
        {parentPaired && (
          <View style={styles.section}>
            <MicroLabel>Parent Connection</MicroLabel>
            <ShineCard style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <TouchableOpacity
                style={[styles.infoRow, { borderBottomColor: 'transparent' }]}
                onPress={handleDisconnectParent}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { fontFamily: theme.fMono, color: theme.red }]}>DISCONNECT PARENT</Text>
                {disconnected ? (
                  <Text style={[{ fontFamily: theme.fMono, fontSize: 11, color: '#34d399' }]}>Disconnected</Text>
                ) : (
                  <Text style={[styles.editPencil, { color: theme.red }]}>›</Text>
                )}
              </TouchableOpacity>
            </ShineCard>
          </View>
        )}

        {/* Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MicroLabel>My Classes</MicroLabel>
            <TouchableOpacity onPress={() => setPhase('onboarding')}>
              <Text style={[styles.editLink, { fontFamily: theme.fMono, color: theme.accent }]}>Edit schedule →</Text>
            </TouchableOpacity>
          </View>
          <ShineCard style={[styles.infoCard, { backgroundColor: theme.surface }]}>
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
          </ShineCard>
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
          {/* Today background photo */}
          <View style={[styles.bgPhotoRow, { borderColor: theme.line, backgroundColor: theme.surface }]}>
            <View style={styles.bgPhotoInfo}>
              <Text style={[styles.bgPhotoLabel, { fontFamily: theme.fBody, color: theme.ink }]}>Today background</Text>
              <Text style={[styles.bgPhotoHint, { fontFamily: theme.fMono, color: theme.soft }]}>
                {bgImageUri ? 'Photo set ✓' : 'No photo set'}
              </Text>
            </View>
            <View style={styles.bgPhotoBtns}>
              {bgImageUri !== '' && (
                <TouchableOpacity
                  style={[styles.bgPhotoBtn, { borderColor: theme.line }]}
                  onPress={() => setBgImageUri('')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.bgPhotoBtnText, { fontFamily: theme.fMono, color: theme.soft }]}>Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.bgPhotoBtn, { backgroundColor: theme.accent }]}
                onPress={handlePickBgImage}
                activeOpacity={0.8}
              >
                <Text style={[styles.bgPhotoBtnText, { fontFamily: theme.fMono, color: '#fff' }]}>
                  {bgImageUri ? 'Change' : 'Choose photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
    borderWidth: 0,
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
  secureInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  pwBtn: {
    borderRadius: 32,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pwBtnText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  pairCard: { borderRadius: 28, borderWidth: 0, padding: 18, gap: 14 },
  pairHint: { fontSize: 14, lineHeight: 20 },
  codeBox: { borderRadius: 20, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', gap: 6 },
  codeText: { fontSize: 32, letterSpacing: 8, fontWeight: '700' },
  copyBtn: { fontSize: 11, letterSpacing: 1 },
  bgPhotoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14, gap: 12, marginTop: 10 },
  bgPhotoInfo: { flex: 1 },
  bgPhotoLabel: { fontSize: 15 },
  bgPhotoHint: { fontSize: 11, letterSpacing: 0.3, marginTop: 2 },
  bgPhotoBtns: { flexDirection: 'row', gap: 8 },
  bgPhotoBtn: { borderRadius: 28, paddingHorizontal: 14, paddingVertical: 8, borderWidth: StyleSheet.hairlineWidth },
  bgPhotoBtnText: { fontSize: 12, letterSpacing: 0.3 },
});
