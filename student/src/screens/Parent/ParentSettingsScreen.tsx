import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { makeTheme, Vibe } from '../../theme';
import { supabase } from '../../lib/supabase';
import { deleteParentLink } from '../../lib/db';
import { useParentData } from '../../lib/parentData';
import { confirmAction } from '../../lib/confirm';
import MicroLabel from '../../components/MicroLabel';
import PlanPicker from './PlanPicker';
import {
  useParentPlan, trialDaysLeft, openBillingPortal, setSummerKeep, billingErrorText, PRICES,
} from '../../lib/billing';

function planLine(p: ReturnType<typeof useParentPlan>): string {
  const plan = p.plan;
  if (!p.paywallEnabled && !plan?.hasStripe) return 'Free for now while we get started.';
  if (!plan) return 'Your free week starts when you link your kid.';
  const date = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
  const name = plan.plan ? `${PRICES[plan.plan].label} (${PRICES[plan.plan].price}${PRICES[plan.plan].per})` : '';
  switch (plan.status) {
    case 'trial': {
      const d = trialDaysLeft(plan);
      return d > 0 ? `Free trial · ${d} day${d === 1 ? '' : 's'} left` : 'Your free week is over.';
    }
    case 'active': return `${name} · renews ${date(plan.currentPeriodEnd)}`;
    case 'paused': return `${name} · paused for summer, restarts ${date(plan.pausedUntil) || 'Sept 5'}`;
    case 'past_due': return `${name} · payment didn’t go through`;
    case 'canceled': return plan.currentPeriodEnd && new Date(plan.currentPeriodEnd) > new Date() ? `Cancelled · works until ${date(plan.currentPeriodEnd)}` : 'Cancelled';
  }
  return '';
}

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
  const plan = useParentPlan(isDemo ? '' : store.userId);
  const [planBusy, setPlanBusy] = useState(false);
  const [planMsg, setPlanMsg] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const p = plan.plan;
  const canManage = !!p?.hasStripe;

  async function managePlan() {
    setPlanBusy(true); setPlanMsg('');
    const r = await openBillingPortal();
    if (!r.ok) { setPlanMsg(billingErrorText(r.error)); setPlanBusy(false); }
  }

  async function toggleSummer(keep: boolean) {
    setPlanBusy(true); setPlanMsg('');
    const r = await setSummerKeep(keep);
    setPlanBusy(false);
    if (!r.ok) setPlanMsg(billingErrorText(r.error)); else plan.reload();
  }

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

        {!isDemo && plan.loaded && (
          <View style={styles.section}>
            <MicroLabel>Your plan</MicroLabel>
            <View style={[styles.planCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.planLine, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{planLine(plan)}</Text>
              {canManage ? (
                <TouchableOpacity style={[styles.btnWide, { backgroundColor: theme.accent }]} onPress={managePlan} disabled={planBusy} accessibilityRole="button">
                  {planBusy ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, { fontFamily: theme.fMono }]}>Manage plan</Text>}
                </TouchableOpacity>
              ) : plan.paywallEnabled && (
                <TouchableOpacity style={[styles.btnWide, { backgroundColor: theme.accent }]} onPress={() => setShowPlans((v) => !v)} accessibilityRole="button">
                  <Text style={[styles.btnText, { fontFamily: theme.fMono }]}>{showPlans ? 'Hide plans' : 'Choose a plan'}</Text>
                </TouchableOpacity>
              )}
              {canManage && <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>Switch plans, update your card, see receipts or cancel.</Text>}
            </View>
            {showPlans && !canManage && <PlanPicker theme={theme} trialDays={trialDaysLeft(p)} />}
            {p?.plan === 'monthly' && canManage && (
              <View style={[styles.planCard, styles.summerRow, { backgroundColor: theme.surface }]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.planLine, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>Keep it on over summer</Text>
                  <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.soft }]}>
                    Off: no charges July 1 to Sept 4, it starts again Sept 5. Turn on for summer camps, jobs or summer school.
                  </Text>
                </View>
                <Switch value={p.summerKeep} onValueChange={toggleSummer} disabled={planBusy} accessibilityLabel="Keep the plan on over summer" />
              </View>
            )}
            {planMsg !== '' && <Text style={[styles.hint, { fontFamily: theme.fBody, color: theme.red }]}>{planMsg}</Text>}
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
  planCard: { borderRadius: 16, padding: 14, gap: 10 },
  planLine: { fontSize: 16, lineHeight: 22 },
  summerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, padding: 14 },
  kidName: { fontSize: 16 },
  unlink: { fontSize: 14 },
  vibe: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  vibeText: { fontSize: 14 },
  signOut: { borderRadius: 32, borderWidth: 1, padding: 14, alignItems: 'center' },
  signOutText: { fontSize: 15, letterSpacing: 1.5 },
});
