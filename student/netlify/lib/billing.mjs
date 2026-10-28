// Shared helpers for the billing functions: Stripe's REST API, Supabase with the
// service-role key, and the summer calendar. No npm packages needed.
//
// Environment variables (Netlify → Site configuration → Environment variables):
//   STRIPE_SECRET_KEY          sk_live_… (or sk_test_… while testing)
//   STRIPE_WEBHOOK_SECRET      whsec_… from the webhook endpoint in Stripe
//   STRIPE_PRICE_MONTHLY       price_… for $4.99 / month
//   STRIPE_PRICE_YEARLY        price_… for $39.99 / year
//   SUPABASE_SERVICE_ROLE_KEY  Supabase → Project Settings → API keys → secret / service_role
//   SUPABASE_URL               optional; defaults to the app's project
import crypto from 'node:crypto';

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ptrhfjfskzvoblrnuhrl.supabase.co';
const TZ = 'America/Vancouver';

export function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

export function missingConfig(...names) {
  const missing = names.filter((n) => !process.env[n]);
  return missing.length ? json(503, { error: 'not_configured', missing }) : null;
}

// ─── Stripe ──────────────────────────────────────────────────────────────────

/** Stripe wants form encoding with brackets for nested values: a[b][0]=c */
export function formEncode(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') formEncode(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export async function stripe(method, path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: method === 'GET' ? undefined : formEncode(params || {}).toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`stripe ${method} ${path}: ${data?.error?.message || res.status}`);
  return data;
}

/** Checks Stripe's signature header; returns the parsed event or null. */
export function verifyStripeEvent(rawBody, header, secret, toleranceSec = 300, now = Date.now()) {
  if (!header || !secret) return null;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const sigs = header.split(',').filter((p) => p.trim().startsWith('v1=')).map((p) => p.trim().slice(3));
  const t = Number(parts.t);
  if (!t || !sigs.length) return null;
  if (Math.abs(now / 1000 - t) > toleranceSec) return null;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const ok = sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
  if (!ok) return null;
  try { return JSON.parse(rawBody); } catch { return null; }
}

// ─── Supabase (service role: bypasses row-level security, server only) ───────

function sbHeaders(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', ...extra };
}

export async function sbSelect(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders() });
  if (!res.ok) throw new Error(`supabase select ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function sbUpsert(table, row, onConflict) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: sbHeaders({ prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`supabase upsert ${table}: ${res.status} ${await res.text()}`);
  return (await res.json())[0];
}

/** The signed-in user behind the app's access token, or null. */
export async function userFromRequest(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const u = await res.json();
  return u?.id ? u : null;
}

export async function getSubscription(parentId) {
  const rows = await sbSelect('subscriptions', `parent_id=eq.${parentId}&select=*`);
  return rows[0] || null;
}

export async function getRole(userId) {
  const rows = await sbSelect('profiles', `id=eq.${userId}&select=role`);
  return rows[0]?.role || null;
}

// ─── Summer (Vancouver time) ─────────────────────────────────────────────────

/** { year, month (1-12), day } in Vancouver for a moment in time. */
export function localDate(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(d).filter((x) => x.type !== 'literal').map((x) => [x.type, Number(x.value)]));
  return { year: p.year, month: p.month, day: p.day };
}

export function isSummer(d = new Date()) {
  const { month } = localDate(d);
  return month === 7 || month === 8;
}

/** Sept 1, midnight Vancouver (PDT, UTC-7), as a Unix timestamp. */
export function septemberFirst(d = new Date()) {
  const { year } = localDate(d);
  return Math.floor(Date.UTC(year, 8, 1, 7, 0, 0) / 1000);
}

// ─── Stripe subscription → our row ───────────────────────────────────────────

export function planFromPrice(priceId, interval) {
  if (priceId && priceId === process.env.STRIPE_PRICE_YEARLY) return 'yearly';
  if (priceId && priceId === process.env.STRIPE_PRICE_MONTHLY) return 'monthly';
  return interval === 'year' ? 'yearly' : 'monthly';
}

export function rowFromSubscription(sub) {
  const item = sub.items?.data?.[0];
  const periodEnd = sub.current_period_end ?? item?.current_period_end ?? null;
  let status;
  if (sub.pause_collection) status = 'paused';
  else if (sub.status === 'active' || sub.status === 'trialing') status = 'active';
  else if (sub.status === 'past_due' || sub.status === 'unpaid') status = 'past_due';
  else if (sub.status === 'canceled' || sub.status === 'incomplete_expired') status = 'canceled';
  else status = null; // incomplete: first payment still pending, leave the row as it was
  return {
    status,
    plan: planFromPrice(item?.price?.id, item?.price?.recurring?.interval),
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    paused_until: sub.pause_collection?.resumes_at ? new Date(sub.pause_collection.resumes_at * 1000).toISOString() : null,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
    stripe_subscription_id: sub.id,
  };
}

/** Pause a monthly plan for summer (no charges until Sept 1), or lift the pause. */
export async function setSummerPause(subscriptionId, pause, now = new Date()) {
  return stripe('POST', `subscriptions/${subscriptionId}`, pause
    ? { pause_collection: { behavior: 'void', resumes_at: septemberFirst(now) } }
    : { pause_collection: '' });
}
