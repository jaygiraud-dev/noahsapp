// Runs every day. From July 1 to Aug 31 it pauses monthly plans (no charges)
// unless the parent chose to keep it on. Stripe restarts billing by itself on Sept 1.
// The yearly plan already covers summer, so it's never paused.
import { json, missingConfig, sbSelect, isSummer, setSummerPause } from '../lib/billing.mjs';

export async function pauseForSummer(now = new Date()) {
  if (!isSummer(now)) return { paused: 0, skipped: 'not_summer' };
  const rows = await sbSelect('subscriptions',
    'plan=eq.monthly&status=eq.active&summer_keep=eq.false&stripe_subscription_id=not.is.null&select=parent_id,stripe_subscription_id');
  let paused = 0;
  for (const r of rows) {
    try { await setSummerPause(r.stripe_subscription_id, true, now); paused++; } catch (e) { console.error('pause failed', r.parent_id, e.message); }
  }
  return { paused };
}

export default async () => {
  const bad = missingConfig('STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (bad) return bad;
  return json(200, await pauseForSummer());
};

export const config = { schedule: '0 8 * * *' }; // daily, ~1 AM Vancouver
