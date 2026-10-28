// POST /.netlify/functions/billing-portal
// Stripe's page for switching plan, updating the card, seeing receipts or cancelling.
import { json, missingConfig, stripe, userFromRequest, getSubscription } from '../lib/billing.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });
  const bad = missingConfig('STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (bad) return bad;

  const user = await userFromRequest(req);
  if (!user) return json(401, { error: 'not_signed_in' });
  const sub = await getSubscription(user.id);
  if (!sub?.stripe_customer_id) return json(404, { error: 'no_customer' });

  const session = await stripe('POST', 'billing_portal/sessions', {
    customer: sub.stripe_customer_id,
    return_url: `${new URL(req.url).origin}/`,
  });
  return json(200, { url: session.url });
};
