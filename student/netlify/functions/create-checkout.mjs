// POST /.netlify/functions/create-checkout  { plan: 'monthly' | 'yearly' }
// Opens Stripe Checkout (Apple Pay, Google Pay or card) for the signed-in parent.
import {
  json, missingConfig, stripe, userFromRequest, getRole, getSubscription, sbUpsert,
} from '../lib/billing.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });
  const bad = missingConfig('STRIPE_SECRET_KEY', 'STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_YEARLY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (bad) return bad;

  const user = await userFromRequest(req);
  if (!user) return json(401, { error: 'not_signed_in' });
  if ((await getRole(user.id)) !== 'parent') return json(403, { error: 'not_a_parent' });

  const { plan } = await req.json().catch(() => ({}));
  const price = plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY : plan === 'monthly' ? process.env.STRIPE_PRICE_MONTHLY : null;
  if (!price) return json(400, { error: 'bad_plan' });

  const sub = await getSubscription(user.id);
  if (sub?.stripe_subscription_id && ['active', 'paused', 'past_due'].includes(sub.status)) {
    return json(409, { error: 'already_subscribed' });
  }

  let customer = sub?.stripe_customer_id;
  if (!customer) {
    const c = await stripe('POST', 'customers', { email: user.email, metadata: { parent_id: user.id } });
    customer = c.id;
    await sbUpsert('subscriptions', { parent_id: user.id, stripe_customer_id: customer, updated_at: new Date().toISOString() }, 'parent_id');
  }

  // Paying before the free week is up keeps the rest of the week free
  // (Stripe needs a trial end at least 2 days away)
  const trialEnd = sub?.status === 'trial' && sub.trial_ends_at ? Math.floor(new Date(sub.trial_ends_at).getTime() / 1000) : 0;
  const keepTrial = trialEnd > Date.now() / 1000 + 2 * 86400;

  const origin = new URL(req.url).origin;
  const session = await stripe('POST', 'checkout/sessions', {
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: 'true',
    subscription_data: { metadata: { parent_id: user.id }, ...(keepTrial ? { trial_end: trialEnd } : {}) },
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancel`,
  });
  return json(200, { url: session.url });
};
