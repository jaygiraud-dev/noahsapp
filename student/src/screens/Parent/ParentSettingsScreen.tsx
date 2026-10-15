import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme, Vibe } from '../../theme';
import { supabase } from '../../lib/supabase';
import { deleteParentLink } from '../../lib/db';
import { useParentData } from '../../lib/parentData';
import { confirmAction } from '../../lib/confirm';
import MicroLabel from '../../components/MicroLabel';

const VIBES: Array<{ id: Vibe; label: string }> = [
  { id: 'twilight', label: 'Aura' }, { id: 'clay', label: 'Clay' }, { id: 'paper', label: 'Paper' }, { id: 'mono', label: 'Mono' },
];

export default function ParentSettingsScreen({ navigation }: any) {
  const store = useStore();
  const theme = makeTheme(store.vibe, store.darkMode);
  const { kids, parentId, removeKidLocal } = useParentData();
  const isDemo = !store.userId;
  const [name, setName] = useState(store.displayName);
  const [nameSaved, setNameSaved] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function saveName() {
    const n = name.trim();
    if (!n) return;
    store.setDisplayName(n);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 1500);
  }

  async function savePassword() {
    if (pw.length < 6) { setPwMsg({ ok: false, text: 'Use at least 6 characters.' }); return; }
    if (pw !== pw2) { setPwMsg({ ok: false, text: 'The two passwords don’t match.' }); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) setPwMsg({ ok: false, text: error.message });
    else { setPwMsg({ ok: true, text: '✓ Password updated' }); setPw(''); setPw2(''); }
  }

  function unlink(kidId: string, kidName: string) {
    confirmAction('Unlink kid?', `You’ll stop seeing ${kidName}’s homework and plans. You can link again with their code.`, 'Unlink', async () => {
      removeKidLocal(kidId);
      if (parentId) await deleteParentLink(parentId, kidId);
    });
  }

  async function signOut() {
    if (!isDemo) await supabase.auth.signOut();
    store.setPhase('auth');
  }

  const input = [styles.input, { borderColor: theme.line, backgroundColor: theme.surface, color: theme.ink, fontFamily: theme.fBody }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { fontFamily: theme.fMono, color: theme.accent }]}>← dashboard</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>Settings.</Text>

        {!isDemo && (
          <View style={styles.section}>
            <MicroLabel>Your name</MicroLabel>
            <View style={styles.row}>
              <TextInput style={[...input, { flex: 1, minWidth: 0 }]} value={name} onChangeText={setName} onSubmitEditing={saveName} accessibilityLabel="Your name" />
              <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={saveName}>
                <Text style={[styles.btnText, { fontFamily: theme.fMono }]}>{nameSaved ? '✓' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>Your kid sees this name under Me → Parents. Signed in as {store.email}.</Text>
          </View>
        )}

        <View style={styles.section}>
          <MicroLabel>Linked kids</MicroLabel>
          {kids.length === 0 && <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>No kids linked yet.</Text>}
          {kids.map((k) => (
            <View key={k.id} style={[styles.kidRow, { backgroundColor: theme.surface }]}>
              <Text style={[styles.kidName, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{k.name}</Text>
              {k.id !== 'demo' && (
                <TouchableOpacity onPress={() => unlink(k.id, k.name)}>
                  <Text style={[styles.unlink, { fontFamily: theme.fMono, color: theme.red }]}>Unlink</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>
            You can see homework, due dates, classes and plans. Friends and anything between friends stay private to your kid.
          </Text>
        </View>

        {!isDemo && (
          <View style={styles.section}>
            <MicroLabel>Change password</MicroLabel>
            <TextInput style={input} value={pw} onChangeText={setPw} secureTextEntry placeholder="New password" placeholderTextColor={theme.soft} />
            <TextInput style={input} value={pw2} onChangeText={setPw2} secureTextEntry placeholder="Type it again" placeholderTextColor={theme.soft} />
            {pwMsg && <Text style={[styles.hint, { fontFamily: theme.fBody, color: pwMsg.ok ? theme.mint : theme.red }]}>{pwMsg.text}</Text>}
            <TouchableOpacity style={[styles.btnWide, { backgroundColor: theme.accent }]} onPress={savePassword}>
              <Text style={[styles.btnText, { fontFamily: theme.fMono }]}>Update password</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <MicroLabel>Look</MicroLabel>
          <View style={styles.row}>
            {VIBES.map((v) => (
              <TouchableOpacity key={v.id} onPress={() => store.setVibe(v.id)} style={[styles.vibe, { borderColor: store.vibe === v.id ? theme.accent : theme.line, backgroundColor: store.vibe === v.id ? theme.accent + '1f' : 'transparent' }]}>
                <Text style={[styles.vibeText, { fontFamily: theme.fMono, color: store.vibe === v.id ? theme.accent : theme.sub }]}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[styles.signOut, { borderColor: theme.red + '55' }]} onPress={signOut}>
          <Text style={[styles.signOutText, { fontFamily: theme.fMono, color: theme.red }]}>{isDemo ? 'LEAVE DEMO' : 'SIGN OUT'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 22, paddingBottom: 48 },
  back: { fontSize: 15, letterSpacing: 0.5 },
  title: { fontSize: 34 },
  section: { gap: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  btn: { borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center' },
  btnWide: { borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15 },
  hint: { fontSize: 15, lineHeight: 21 },
  kidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, padding: 14 },
  kidName: { fontSize: 16 },
  unlink: { fontSize: 14 },
  vibe: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  vibeText: { fontSize: 14 },
  signOut: { borderRadius: 32, borderWidth: 1, padding: 14, alignItems: 'center' },
  signOutText: { fontSize: 15, letterSpacing: 1.5 },
});
