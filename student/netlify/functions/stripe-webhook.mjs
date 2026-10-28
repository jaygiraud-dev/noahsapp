// POST /.netlify/functions/stripe-webhook   (Stripe calls this, not the app)
// Keeps public.subscriptions in step with Stripe. Events to send from Stripe:
//   checkout.session.completed, customer.subscription.created,
//   customer.subscription.updated, customer.subscription.deleted
import {
  json, missingConfig, verifyStripeEvent, stripe, sbSelect, sbUpsert, rowFromSubscription,
} from '../lib/billing.mjs';

async function parentFor(sub) {
  if (sub.metadata?.parent_id) return sub.metadata.parent_id;
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  const rows = await sbSelect('subscriptions', `stripe_customer_id=eq.${encodeURIComponent(customer)}&select=parent_id`);
  return rows[0]?.parent_id || null;
}

export async function applySubscription(sub) {
  const parentId = await parentFor(sub);
  if (!parentId) return 'unknown_parent';
  const row = rowFromSubscription(sub);
  if (!row.status) delete row.status;
  await sbUpsert('subscriptions', { parent_id: parentId, ...row, updated_at: new Date().toISOString() }, 'parent_id');
  return 'ok';
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });
  const bad = missingConfig('STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUPABASE_SERVICE_ROLE_KEY');
  if (bad) return bad;

  const raw = await req.text();
  const event = verifyStripeEvent(raw, req.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
  if (!event) return json(400, { error: 'bad_signature' });

  const obj = event.data?.object;
  let result = 'ignored';
  if (event.type === 'checkout.session.completed' && obj?.subscription) {
    const sub = await stripe('GET', `subscriptions/${obj.subscription}`);
    if (!sub.metadata?.parent_id && obj.client_reference_id) sub.metadata = { ...sub.metadata, parent_id: obj.client_reference_id };
    result = await applySubscription(sub);
  } else if (event.type?.startsWith('customer.subscription.')) {
    result = await applySubscription(obj);
  }
  return json(200, { received: true, result });
};
