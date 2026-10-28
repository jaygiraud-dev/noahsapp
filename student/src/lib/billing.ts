import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { supabase } from './supabase';

// Shown in the app; the real amounts are set on the Stripe prices.
export const PRICES = {
  monthly: { label: 'Monthly', price: '$4.99', per: '/month', note: 'Pauses on its own July–August' },
  yearly: { label: 'School year', price: '$39.99', per: '/year', note: 'Save 33% · summer included' },
} as const;
export type PlanKind = keyof typeof PRICES;

export type PlanStatus = 'trial' | 'active' | 'paused' | 'past_due' | 'canceled';

export interface ParentPlan {
  status: PlanStatus;
  plan: PlanKind | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  pausedUntil: string | null;
  summerKeep: boolean;
  hasStripe: boolean;
}

export interface PlanState {
  plan: ParentPlan | null;
  /** Off until the owner switches it on in Supabase (app_settings.paywall_enabled) */
  paywallEnabled: boolean;
  loaded: boolean;
}

function rowToPlan(r: any): ParentPlan {
  return {
    status: r.status,
    plan: r.plan ?? null,
    trialEndsAt: r.trial_ends_at ?? null,
    currentPeriodEnd: r.current_period_end ?? null,
    pausedUntil: r.paused_until ?? null,
    summerKeep: !!r.summer_keep,
    hasStripe: !!r.stripe_subscription_id,
  };
}

export async function fetchParentPlan(parentId: string): Promise<PlanState> {
  const [subRes, setRes] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('parent_id', parentId).maybeSingle(),
    supabase.from('app_settings').select('paywall_enabled').maybeSingle(),
  ]);
  // Tables missing (database update not run yet) → behave as free
  if (setRes.error || subRes.error) return { plan: null, paywallEnabled: false, loaded: true };
  return { plan: subRes.data ? rowToPlan(subRes.data) : null, paywallEnabled: !!setRes.data?.paywall_enabled, loaded: true };
}

export function hasAccess(s: PlanState, now = new Date()): boolean {
  if (!s.paywallEnabled) return true;
  const p = s.plan;
  if (!p) return true; // no kid linked yet, so nothing to lock
  if (p.status === 'active' || p.status === 'paused') return true;
  if (p.status === 'trial') return !!p.trialEndsAt && new Date(p.trialEndsAt) > now;
  return !!p.currentPeriodEnd && new Date(p.currentPeriodEnd) > now;
}

export function trialDaysLeft(p: ParentPlan | null, now = new Date()): number {
  if (!p || p.status !== 'trial' || !p.trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(p.trialEndsAt).getTime() - now.getTime()) / 86400000));
}

/** Late-June and late-August heads-ups for monthly plans. */
export function summerNotice(p: ParentPlan | null, now = new Date()): 'pausing' | 'resuming' | null {
  if (!p || p.plan !== 'monthly') return null;
  const m = now.getMonth() + 1; const d = now.getDate();
  if (m === 6 && d >= 20 && p.status === 'active' && !p.summerKeep) return 'pausing';
  if (m === 8 && d >= 20 && p.status === 'paused') return 'resuming';
  return null;
}

export type BillingResult = { ok: true; url?: string; data?: any } | { ok: false; error: string };

async function callBilling(fn: string, body: object = {}): Promise<BillingResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: 'not_signed_in' };
  try {
    const res = await fetch(`/.netlify/functions/${fn}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const out = await res.json().catch(() => null);
    if (!res.ok || !out) return { ok: false, error: out?.error ?? (res.status === 404 ? 'not_configured' : 'network') };
    return { ok: true, url: out.url, data: out };
  } catch {
    return { ok: false, error: 'network' };
  }
}

function go(url: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.href = url;
  else Linking.openURL(url);
}

export async function startCheckout(plan: PlanKind): Promise<BillingResult> {
  const r = await callBilling('create-checkout', { plan });
  if (r.ok && r.url) go(r.url);
  return r;
}

export async function openBillingPortal(): Promise<BillingResult> {
  const r = await callBilling('billing-portal');
  if (r.ok && r.url) go(r.url);
  return r;
}

export function setSummerKeep(keep: boolean): Promise<BillingResult> {
  return callBilling('summer-keep', { keep });
}

export function billingErrorText(error: string): string {
  if (error === 'not_configured') return 'Payments aren’t switched on yet. Try again soon.';
  if (error === 'already_subscribed') return 'You already have a plan. Use Manage plan to change it.';
  if (error === 'not_signed_in') return 'Sign in again, then try once more.';
  if (error === 'no_customer') return 'There’s no payment on file yet. Choose a plan first.';
  return 'Couldn’t reach the payment page. Check your connection and try again.';
}

/** "?checkout=success" after Stripe sends the parent back. Read once, then cleared. */
function takeCheckoutResult(): 'success' | 'cancel' | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('checkout');
  if (!v) return null;
  window.history.replaceState(null, '', window.location.pathname);
  return v === 'success' ? 'success' : v === 'cancel' ? 'cancel' : null;
}

export function useParentPlan(parentId: string) {
  const [state, setState] = useState<PlanState>({ plan: null, paywallEnabled: false, loaded: false });
  const [checkout] = useState(takeCheckoutResult);

  const reload = useCallback(async () => {
    if (!parentId) { setState({ plan: null, paywallEnabled: false, loaded: true }); return; }
    setState(await fetchParentPlan(parentId));
  }, [parentId]);

  useEffect(() => { reload(); }, [reload]);

  // Stripe's webhook can land a moment after the parent is sent back: check again
  useEffect(() => {
    if (checkout !== 'success' || !parentId) return;
    const t1 = setTimeout(reload, 2500);
    const t2 = setTimeout(reload, 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [checkout, parentId]);

  return { ...state, reload, checkout };
}
