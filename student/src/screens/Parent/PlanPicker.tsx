import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { makeTheme } from '../../theme';
import { PRICES, PlanKind, startCheckout, billingErrorText } from '../../lib/billing';

type Theme = ReturnType<typeof makeTheme>;

/** Monthly or school-year, then off to Stripe (Apple Pay, Google Pay or card). */
export default function PlanPicker({ theme, trialDays }: { theme: Theme; trialDays?: number }) {
  const [choice, setChoice] = useState<PlanKind>('yearly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function go() {
    setBusy(true); setError('');
    const r = await startCheckout(choice);
    if (!r.ok) { setError(billingErrorText(r.error)); setBusy(false); }
    // On success the browser leaves for Stripe's checkout page
  }

  return (
    <View style={styles.wrap}>
      {(['yearly', 'monthly'] as PlanKind[]).map((k) => {
        const on = choice === k;
        const p = PRICES[k];
        return (
          <TouchableOpacity
            key={k}
            onPress={() => setChoice(k)}
            activeOpacity={0.85}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${p.label}, ${p.price} ${p.per}. ${p.note}`}
            style={[styles.option, { backgroundColor: theme.surface, borderColor: on ? theme.accent : theme.line, borderWidth: on ? 2 : 1 }]}
          >
            <View style={[styles.radio, { borderColor: on ? theme.accent : theme.soft }]}>
              {on && <View style={[styles.radioDot, { backgroundColor: theme.accent }]} />}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.optTitle, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>{p.label}</Text>
                {k === 'yearly' && (
                  <View style={[styles.best, { backgroundColor: theme.mint + '26' }]}>
                    <Text style={[styles.bestText, { fontFamily: theme.fMono, color: theme.mint }]}>BEST VALUE</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.optNote, { fontFamily: theme.fBody, color: theme.sub }]}>{p.note}</Text>
            </View>
            <Text style={[styles.price, { fontFamily: theme.fBodySemiBold, color: theme.ink }]}>
              {p.price}<Text style={[styles.per, { fontFamily: theme.fBody, color: theme.sub }]}>{p.per}</Text>
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity activeOpacity={0.85} onPress={go} disabled={busy} accessibilityRole="button">
        <LinearGradient colors={theme.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.cta, busy && { opacity: 0.6 }]}>
          {busy ? <ActivityIndicator color="#0d0d0d" /> : (
            <View style={styles.ctaRow}>
              <Ionicons name="logo-apple" size={19} color="#0d0d0d" />
              <Text style={[styles.ctaText, { fontFamily: theme.fBodySemiBold }]}>Pay with Apple Pay or card</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
      {error !== '' && <Text style={[styles.err, { fontFamily: theme.fBody, color: theme.red }]}>{error}</Text>}
      <Text style={[styles.fine, { fontFamily: theme.fBody, color: theme.soft }]}>
        {trialDays && trialDays > 0
          ? `You won’t be charged until your free week ends (${trialDays} day${trialDays === 1 ? '' : 's'} left). `
          : ''}
        Covers every kid in your family. Cancel anytime. Prices in CAD.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  optTitle: { fontSize: 17 },
  best: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  bestText: { fontSize: 11, letterSpacing: 1 },
  optNote: { fontSize: 14 },
  price: { fontSize: 18 },
  per: { fontSize: 13 },
  cta: { height: 54, borderRadius: 999, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { fontSize: 17, color: '#0d0d0d' },
  err: { fontSize: 15, textAlign: 'center' },
  fine: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
