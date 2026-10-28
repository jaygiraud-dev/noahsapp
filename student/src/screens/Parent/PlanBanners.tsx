import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { makeTheme } from '../../theme';
import {
  PlanState, trialDaysLeft, summerNotice, openBillingPortal, setSummerKeep, billingErrorText,
} from '../../lib/billing';
import PlanPicker from './PlanPicker';

type Theme = ReturnType<typeof makeTheme>;

function Banner({ theme, tone, text, action, onAction, busy }: {
  theme: Theme; tone: string; text: string; action?: string; onAction?: () => void; busy?: boolean;
}) {
  return (
    <View style={[styles.banner, { backgroundColor: tone + '1f', borderColor: tone + '66' }]} accessibilityRole="summary">
      <Text style={[styles.bannerText, { fontFamily: theme.fBodyMedium, color: theme.ink }]}>{text}</Text>
      {action && (
        <TouchableOpacity onPress={onAction} disabled={busy} style={[styles.bannerBtn, { backgroundColor: tone }]} accessibilityRole="button">
          {busy ? <ActivityIndicator size="small" color="#0d0d0d" /> : <Text style={[styles.bannerBtnText, { fontFamily: theme.fBodySemiBold }]}>{action}</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Trial countdown, payment problems and the summer heads-ups, at the top of the dashboard. */
export function PlanBanners({ theme, state, checkout, reload }: {
  theme: Theme; state: PlanState; checkout: 'success' | 'cancel' | null; reload: () => void;
}) {
  const [showPlans, setShowPlans] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const p = state.plan;
  const days = trialDaysLeft(p);
  const notice = summerNotice(p);

  async function portal() {
    setBusy(true); setError('');
    const r = await openBillingPortal();
    if (!r.ok) { setError(billingErrorText(r.error)); setBusy(false); }
  }

  async function keepOn() {
    setBusy(true); setError('');
    const r = await setSummerKeep(true);
    setBusy(false);
    if (!r.ok) setError(billingErrorText(r.error)); else reload();
  }

  const items: React.ReactNode[] = [];
  if (checkout === 'success') {
    items.push(<Banner key="ok" theme={theme} tone={theme.mint} text="🎉 You’re all set. Thanks for subscribing!" />);
  }
  if (state.paywallEnabled && p?.status === 'trial' && days > 0 && checkout !== 'success') {
    items.push(
      <Banner key="trial" theme={theme} tone={theme.amber}
        text={days === 1 ? 'Free trial: last day today' : `Free trial: ${days} days left`}
        action={showPlans ? 'Hide' : 'Choose a plan'} onAction={() => setShowPlans((v) => !v)} />,
    );
  }
  if (p?.status === 'past_due') {
    items.push(<Banner key="due" theme={theme} tone={theme.red} text="Your last payment didn’t go through." action="Update card" onAction={portal} busy={busy} />);
  }
  if (p?.status === 'canceled' && p.currentPeriodEnd && new Date(p.currentPeriodEnd) > new Date()) {
    const end = new Date(p.currentPeriodEnd).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
    items.push(
      <Banner key="cancel" theme={theme} tone={theme.amber} text={`Your plan ends ${end}.`}
        action={showPlans ? 'Hide' : 'Choose a plan'} onAction={() => setShowPlans((v) => !v)} />,
    );
  }
  if (notice === 'pausing') {
    items.push(
      <Banner key="summer" theme={theme} tone={theme.amber}
        text="School’s almost out ☀️ We’ll pause your plan July 1 so you’re not charged over summer. Want to keep it on for camps or jobs?"
        action="Keep it on" onAction={keepOn} busy={busy} />,
    );
  }
  if (notice === 'resuming') {
    items.push(
      <Banner key="fall" theme={theme} tone={theme.mint}
        text="School’s back soon. Your plan starts again September 1."
        action="Manage plan" onAction={portal} busy={busy} />,
    );
  }

  if (items.length === 0 && !showPlans) return null;
  return (
    <View style={{ gap: 10 }}>
      {items}
      {error !== '' && <Text style={[styles.err, { fontFamily: theme.fBody, color: theme.red }]}>{error}</Text>}
      {showPlans && <PlanPicker theme={theme} trialDays={days} />}
    </View>
  );
}

/** Shown instead of the dashboard once the free week (or a cancelled plan) has run out. */
export function Paywall({ theme, state, kidNames }: { theme: Theme; state: PlanState; kidNames: string[] }) {
  const who = kidNames.length === 1 ? kidNames[0] : kidNames.length > 1 ? 'your kids' : 'your kid';
  const ended = state.plan?.status === 'canceled' || state.plan?.status === 'past_due';
  return (
    <View style={styles.paywall}>
      <Text style={styles.paywallIcon}>📚</Text>
      <Text style={[styles.paywallTitle, { fontFamily: theme.fDisplayItalic, color: theme.ink }]}>
        {ended ? 'Your plan has ended.' : 'Your free week is over.'}
      </Text>
      <Text style={[styles.paywallSub, { fontFamily: theme.fBody, color: theme.sub }]}>
        Pick a plan to keep seeing {who}’s homework, due dates and plans, and to send nudges.
      </Text>
      <View style={{ alignSelf: 'stretch' }}>
        <PlanPicker theme={theme} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  bannerText: { fontSize: 16, lineHeight: 22 },
  bannerBtn: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, minHeight: 40, justifyContent: 'center' },
  bannerBtnText: { fontSize: 15, color: '#0d0d0d' },
  err: { fontSize: 15, textAlign: 'center' },
  paywall: { alignItems: 'center', gap: 12, paddingTop: 12 },
  paywallIcon: { fontSize: 44 },
  paywallTitle: { fontSize: 30, textAlign: 'center' },
  paywallSub: { fontSize: 16, lineHeight: 23, textAlign: 'center', maxWidth: 440, marginBottom: 6 },
});
