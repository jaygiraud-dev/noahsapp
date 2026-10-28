// POST /.netlify/functions/summer-keep  { keep: boolean }
// A parent on the monthly plan chooses to keep paying (and using it) over summer.
import {
  json, missingConfig, userFromRequest, getSubscription, sbUpsert, isSummer, setSummerPause,
} from '../lib/billing.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });
  const bad = missingConfig('SUPABASE_SERVICE_ROLE_KEY');
  if (bad) return bad;

  const user = await userFromRequest(req);
  if (!user) return json(401, { error: 'not_signed_in' });
  const { keep } = await req.json().catch(() => ({}));
  if (typeof keep !== 'boolean') return json(400, { error: 'bad_request' });

  const sub = await getSubscription(user.id);
  if (!sub) return json(404, { error: 'no_plan' });

  // Already in summer: pause or un-pause billing right away
  if (sub.plan === 'monthly' && sub.stripe_subscription_id && isSummer() && process.env.STRIPE_SECRET_KEY) {
    if (keep && sub.status === 'paused') await setSummerPause(sub.stripe_subscription_id, false);
    if (!keep && sub.status === 'active') await setSummerPause(sub.stripe_subscription_id, true);
  }
  const row = await sbUpsert('subscriptions', { parent_id: user.id, summer_keep: keep, updated_at: new Date().toISOString() }, 'parent_id');
  return json(200, { summer_keep: row.summer_keep });
};
