import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Clipboard, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ShineCard from '../../components/ShineCard';
import Avatar from '../../components/Avatar';
import { useStore, GRADES } from '../../store/useStore';
import { makeTheme, Vibe } from '../../theme';
import MicroLabel from '../../components/MicroLabel';
import { supabase } from '../../lib/supabase';
import { pickImage } from '../../lib/images';
import { effectiveStreak } from '../../lib/time';

const VIBES: { id: Vibe; label: string; emoji: string; bg: string; card: string; dots: string[]; textColor: string }[] = [
  { id: 'twilight', label: 'Aura',  emoji: '🔥', bg: '#0d0d0d', card: '#1c1c1c', dots: ['#e8453a', '#f5a623', '#f0c040'], textColor: '#f5f0eb' },
  { id: 'clay',     label: 'Clay',  emoji: '🧱', bg: '#e8d5ff', card: 'rgba(255,255,255,0.85)', dots: ['#ec4899', '#a78bfa', '#06d6e0'], textColor: '#2d1b69' },
  { id: 'paper',    label: 'Paper', emoji: '📄', bg: '#f3eee3', card: 'rgba(255,255,255,0.7)', dots: ['#ec4899', '#d97706', '#3d6b41'], textColor: '#1c1917' },
  { id: 'mono',     label: 'Mono',  emoji: '⬛', bg: '#0a0a0a', card: '#161616', dots: ['#fafafa', '#a3a3a3', '#525252'], textColor: '#fafafa' },
];

export default function MeScreen() {
  const s = useStore();
  const theme = makeTheme(s.vibe, s.darkMode);
  const isDemo = !s.userId;

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(s.displayName);
  const [codeCopied, setCodeCopied] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => { s.loadParents(); }, []);

  function saveName() {
    const n = draftName.trim();
    if (n) s.setDisplayName(n); else setDraftName(s.displayName);
    setEditingName(false);
  }

  async function copyCode() {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(s.pairingCode);
      else Clipboard.setString(s.pairingCode);
    } catch {}
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function changePhoto() {
    setPhotoBusy(true);
    try {
      const img = await pickImage({ maxSize: 256, square: true, quality: 0.7 });
      if (img) s.setAvatar(img.uri);
    } finally { setPhotoBusy(false); }
  }

  async function changeBackground() {
    const img = await pickImage({ maxSize: 1400, quality: 0.6 });
    if (img) s.setBgImageUri(img.uri);
  }

  async function handleSavePassword() {
    setPasswordError('');
    if (newPassword.length < 6) { setPasswordError('Use at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('The two passwords don’t match.'); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) { setPasswordError(error.message); return; }
    setPasswordSuccess(true);
    setNewPassword(''); setConfirmPassword('');
    setTimeout(() => { setPasswordSuccess(false); setShowPasswordForm(false); }, 2000);
  }

  async function handleSignOut() {
    if (!isDemo) await supabase.auth.signOut();
    s.setPhase('auth');
  }

  const row = [styles.infoRow, { borderBottomColor: theme.line }];
  const label = [styles.infoLabel, { fontFamily: theme.fMono, color: theme.soft }];
  const value = [styles.infoValue, { fontFamily: theme.fBody, color: theme.ink }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <LinearGradient colors={theme.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCard}>
          <TouchableOpacity onPress={changePhoto} disabled={photoBusy} accessibilityLabel="Change profile photo">
            <View style={styles.avatarRing}>
              <Avatar uri={s.avatar} name={s.displayName} size={76} colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']} fontFamily={theme.fDisplayItalic} />
            </View>
            <Text style={[styles.photoHint, { fontFamily: theme.fMono }]}>{photoBusy ? 'loading…' : s.avatar ? 'change photo' : 'add photo'}</Text>
          </TouchableOpacity>
          {editingName ? (
            <TextInput
              style={[styles.nameInput, { fontFamily: theme.fBodySemiBold }]}
              value={draftName}
              onChangeText={setDraftName}
              onBlur={saveName}
              onSubmitEditing={saveName}
              autoFocus
              maxLength={40}
              accessibilityLabel="Your name"
            />
          ) : (
            <TouchableOpacity onPress={() => { setDraftName(s.displayName); setEditingName(true); }} accessibilityLabel="Edit your name">
              <Text style={[styles.profileName, { fontFamily: theme.fBodySemiBold }]}>{s.displayName} ✎</Text>
            </TouchableOpacity>
          )}
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { fontFamily: theme.fMono }]}>{s.points.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { fontFamily: theme.fMono }]}>POINTS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { fontFamily: theme.fMono }]}>{effectiveStreak(s.streak, s.lastActivityDate)}</Text>
              <Text style={[styles.statLabel, { fontFamily: theme.fMono }]}>DAY STREAK</Text>
            </View>
          </View>
        </LinearGradient>

        {isDemo && (
          <ShineCard style={[styles.demoCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.demoText, { fontFamily: theme.fBody, color: theme.sub }]}>
              You’re in demo mode. Nothing here is saved to an account. Sign out to create a real account.
            </Text>
          </ShineCard>
        )}

        {/* School */}
        <View style={styles.section}>
          <MicroLabel>School</MicroLabel>
          <ShineCard style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            {!isDemo && s.email !== '' && (
              <View style={row}>
                <Text style={label}>EMAIL</Text>
                <Text style={value} numberOfLines={1}>{s.email}</Text>
              </View>
            )}
            <TouchableOpacity style={row} onPress={() => s.editSetup('SchoolPicker')} activeOpacity={0.7}>
              <Text style={label}>SCHOOL</Text>
              <Text style={value} numberOfLines={1}>{s.school.name || 'Choose your school'} ›</Text>
            </TouchableOpacity>
            <View style={[row, { borderBottomColor: 'transparent' }]}>
              <Text style={label}>GRADE</Text>
              <View style={styles.gradeRow}>
                {GRADES.map((g) => {
                  const active = g === s.grade;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.gradePill, { backgroundColor: active ? theme.accent : 'transparent', borderColor: active ? theme.accent : theme.line }]}
                      onPress={() => s.setGrade(g)}
                      accessibilityLabel={`Grade ${g}`}
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.gradeText, { fontFamily: theme.fBodySemiBold, color: active ? '#fff' : theme.ink }]}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ShineCard>
        </View>

        {/* Classes */}
        {s.timetable && !s.timetable.sameEveryDay && (
          <Text style={[styles.rotateNote, { fontFamily: theme.fMono, color: theme.soft }]}>Your classes rotate by day. Edit schedule to change the order.</Text>
        )}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MicroLabel>My classes</MicroLabel>
            <TouchableOpacity onPress={() => s.editSetup('Classes')}>
              <Text style={[styles.editLink, { fontFamily: theme.fMono, color: theme.accent }]}>Edit schedule →</Text>
            </TouchableOpacity>
          </View>
          <ShineCard style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            {s.classes.length === 0 ? (
              <Text style={[styles.emptyClasses, { fontFamily: theme.fBody, color: theme.soft }]}>No classes yet. Tap Edit schedule to add them.</Text>
            ) : s.classes.map((cls, i) => {
              const slots = s.timetable
                ? Array.from(new Set(Object.values(s.timetable.days).flatMap((row) => row.map((id, j) => (id === cls.id ? s.timetable!.periods[j]?.label.replace(/^Block /, 'B') : null)).filter(Boolean)))).join(' · ')
                : '';
              return (
                <View key={cls.id} style={[styles.classRow, { borderBottomColor: theme.line, borderBottomWidth: i < s.classes.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
                  <View style={[styles.classDot, { backgroundColor: cls.color }]} />
                  <View style={styles.classText}>
                    <Text style={[styles.className, { fontFamily: theme.fBody, color: theme.ink }]}>{cls.emoji} {cls.name}</Text>
                    {!!cls.teacher && <Text style={[styles.classTeacher, { fontFamily: theme.fMono, color: theme.soft }]}>{cls.teacher}</Text>}
                  </View>
                  <Text style={[styles.classTime, { fontFamily: theme.fMono, color: theme.sub }]} numberOfLines={1}>{slots}</Text>
                </View>
              );
            })}
          </ShineCard>
        </View>

        {/* Parents */}
        {!isDemo && (
          <View style={styles.section}>
            <MicroLabel>Parents</MicroLabel>
            <ShineCard style={[styles.pairCard, { backgroundColor: theme.surface }]}>
              {s.parents.length > 0 ? (
                s.parents.map((p) => (
                  <View key={p.parentId} style={styles.parentRow}>
                    <Text style={styles.parentIcon}>👤</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.parentName, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{p.name}</Text>
                      <Text style={[styles.parentSub, { fontFamily: theme.fMono, color: theme.soft }]}>
                        Connected {new Date(p.linkedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={[styles.connected, { fontFamily: theme.fMono, color: theme.mint }]}>✓</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.pairHint, { fontFamily: theme.fBody, color: theme.sub }]}>No parent connected yet.</Text>
              )}
              <Text style={[styles.pairHint, { fontFamily: theme.fBody, color: theme.sub }]}>
                Parents see your homework, due dates and plans. They don’t see your friends.
                {s.parents.length > 0 ? '' : ' To connect, your parent types this code in their parent account:'}
              </Text>
              <TouchableOpacity style={[styles.codeBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '55' }]} onPress={copyCode} activeOpacity={0.7} accessibilityLabel="Copy your code">
                <Text style={[styles.codeText, { fontFamily: theme.fMono, color: theme.accent }]}>{s.pairingCode || '······'}</Text>
                <Text style={[styles.copyBtn, { fontFamily: theme.fMono, color: codeCopied ? theme.mint : theme.accent }]}>{codeCopied ? '✓ copied' : 'your code · tap to copy'}</Text>
              </TouchableOpacity>
            </ShineCard>
          </View>
        )}

        {/* Password */}
        {!isDemo && (
          <View style={styles.section}>
            <MicroLabel>Password</MicroLabel>
            <ShineCard style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              {!showPasswordForm ? (
                <TouchableOpacity style={[row, { borderBottomColor: 'transparent' }]} onPress={() => { setShowPasswordForm(true); setPasswordError(''); }}>
                  <Text style={label}>CHANGE PASSWORD</Text>
                  <Text style={[styles.chev, { color: theme.soft }]}>›</Text>
                </TouchableOpacity>
              ) : passwordSuccess ? (
                <Text style={[styles.pwSuccess, { fontFamily: theme.fMono, color: theme.mint }]}>✓ Password updated</Text>
              ) : (
                <View style={styles.pwForm}>
                  <TextInput style={[styles.secureInput, { fontFamily: theme.fBody, color: theme.ink, borderColor: theme.line, backgroundColor: theme.bg }]} placeholder="New password" placeholderTextColor={theme.soft} secureTextEntry value={newPassword} onChangeText={setNewPassword} autoFocus />
                  <TextInput style={[styles.secureInput, { fontFamily: theme.fBody, color: theme.ink, borderColor: theme.line, backgroundColor: theme.bg }]} placeholder="Type it again" placeholderTextColor={theme.soft} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
                  {passwordError !== '' && <Text style={[styles.pwError, { fontFamily: theme.fBody, color: theme.red }]}>{passwordError}</Text>}
                  <View style={styles.pwBtns}>
                    <TouchableOpacity style={[styles.pwBtn, { backgroundColor: theme.accent }]} onPress={handleSavePassword} disabled={savingPassword}>
                      <Text style={[styles.pwBtnText, { fontFamily: theme.fMono, color: '#fff' }]}>{savingPassword ? 'Saving…' : 'Save'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.pwBtn, { borderWidth: 1, borderColor: theme.line }]} onPress={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); }}>
                      <Text style={[styles.pwBtnText, { fontFamily: theme.fMono, color: theme.soft }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ShineCard>
          </View>
        )}

        {/* Look */}
        <View style={styles.section}>
          <MicroLabel>Look</MicroLabel>
          <View style={styles.vibeRow}>
            {VIBES.map((v) => {
              const active = s.vibe === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vibeCard, { backgroundColor: v.bg, borderColor: active ? theme.accent : 'transparent', borderWidth: active ? 2.5 : 1.5 }]}
                  onPress={() => s.setVibe(v.id)}
                  activeOpacity={0.8}
                  accessibilityLabel={`${v.label} theme`}
                  accessibilityState={{ selected: active }}
                >
                  <View style={[styles.vibePreview, { backgroundColor: v.card }]}>
                    {v.dots.map((d, i) => <View key={i} style={[styles.vibeBar, { backgroundColor: d + 'cc', width: `${100 - i * 25}%` as any }]} />)}
                  </View>
                  <Text style={[styles.vibeLabel, { fontFamily: theme.fMono, color: v.textColor }]}>{v.emoji} {v.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!theme.isClay && (
            <View style={[styles.settingRow, { backgroundColor: theme.surface }]}>
              <Text style={[styles.settingLabel, { fontFamily: theme.fBody, color: theme.ink }]}>Dark mode</Text>
              <Switch value={s.darkMode} onValueChange={s.setDarkMode} trackColor={{ false: theme.line, true: theme.accent + '88' }} thumbColor={s.darkMode ? theme.accent : theme.soft} />
            </View>
          )}
          <View style={[styles.settingRow, { backgroundColor: theme.surface }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { fontFamily: theme.fBody, color: theme.ink }]}>Background photo</Text>
              <Text style={[styles.settingHint, { fontFamily: theme.fMono, color: theme.soft }]}>{s.bgImageUri ? 'Shows behind Today, Week and Squad' : 'None'}</Text>
            </View>
            {s.bgImageUri !== '' && (
              <TouchableOpacity style={[styles.smallBtn, { borderColor: theme.line, borderWidth: 1 }]} onPress={() => s.setBgImageUri('')}>
                <Text style={[styles.smallBtnText, { fontFamily: theme.fMono, color: theme.soft }]}>Remove</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.smallBtn, { backgroundColor: theme.accent }]} onPress={changeBackground}>
              <Text style={[styles.smallBtnText, { fontFamily: theme.fMono, color: '#fff' }]}>{s.bgImageUri ? 'Change' : 'Choose'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.signOut, { borderColor: theme.red + '55' }]} onPress={handleSignOut}>
          <Text style={[styles.signOutText, { fontFamily: theme.fMono, color: theme.red }]}>{isDemo ? 'LEAVE DEMO' : 'SIGN OUT'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 120 },
  profileCard: { borderRadius: 32, padding: 24, alignItems: 'center', gap: 10 },
  avatarRing: { borderRadius: 42, padding: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  photoHint: { color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: 1, textAlign: 'center', marginTop: 4 },
  profileName: { fontSize: 20, color: '#fff' },
  nameInput: { fontSize: 20, color: '#fff', borderBottomWidth: 1.5, borderBottomColor: '#fff', minWidth: 160, textAlign: 'center', paddingVertical: 2 },
  profileStats: { flexDirection: 'row', gap: 24, alignItems: 'center', marginTop: 4 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 22, letterSpacing: 0.5, color: '#fff' },
  statLabel: { fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.75)' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  demoCard: { borderRadius: 20, padding: 16 },
  demoText: { fontSize: 14, lineHeight: 20 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { fontSize: 11, letterSpacing: 0.5 },
  infoCard: { borderRadius: 24, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  infoLabel: { fontSize: 10, letterSpacing: 1 },
  infoValue: { fontSize: 14, textAlign: 'right', flex: 1 },
  gradeRow: { flexDirection: 'row', gap: 6 },
  gradePill: { width: 34, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 13 },
  emptyClasses: { padding: 16, fontSize: 14 },
  classRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  classDot: { width: 10, height: 10, borderRadius: 5 },
  classText: { flex: 1 },
  className: { fontSize: 15 },
  classTeacher: { fontSize: 11, letterSpacing: 0.3, marginTop: 1 },
  classTime: { fontSize: 11, letterSpacing: 0.3, maxWidth: 140 },
  rotateNote: { fontSize: 10, letterSpacing: 0.3, marginBottom: -12 },
  pairCard: { borderRadius: 24, padding: 18, gap: 12 },
  parentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  parentIcon: { fontSize: 22 },
  parentName: { fontSize: 15 },
  parentSub: { fontSize: 10, letterSpacing: 0.3 },
  connected: { fontSize: 16 },
  pairHint: { fontSize: 14, lineHeight: 20 },
  codeBox: { borderRadius: 18, borderWidth: 1, paddingVertical: 14, alignItems: 'center', gap: 4 },
  codeText: { fontSize: 30, letterSpacing: 8, fontWeight: '700' },
  copyBtn: { fontSize: 11, letterSpacing: 1 },
  chev: { fontSize: 18 },
  pwForm: { padding: 16, gap: 10 },
  secureInput: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  pwError: { fontSize: 13 },
  pwSuccess: { padding: 16, fontSize: 13 },
  pwBtns: { flexDirection: 'row', gap: 10 },
  pwBtn: { flex: 1, borderRadius: 32, paddingVertical: 10, alignItems: 'center' },
  pwBtnText: { fontSize: 13, letterSpacing: 0.5 },
  vibeRow: { flexDirection: 'row', gap: 8 },
  vibeCard: { flex: 1, borderRadius: 20, padding: 10, gap: 8, overflow: 'hidden' },
  vibePreview: { borderRadius: 12, padding: 7, gap: 4 },
  vibeBar: { height: 6, borderRadius: 3 },
  vibeLabel: { fontSize: 10, letterSpacing: 0.3, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  settingLabel: { fontSize: 15, flex: 1 },
  settingHint: { fontSize: 10, letterSpacing: 0.3, marginTop: 2 },
  smallBtn: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  smallBtnText: { fontSize: 12, letterSpacing: 0.3 },
  signOut: { borderRadius: 32, borderWidth: 1, padding: 14, alignItems: 'center', marginTop: 4 },
  signOutText: { fontSize: 13, letterSpacing: 1.5 },
});
