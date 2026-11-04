// Web push to parents' Home Screen app: a notification plus the red number on the
// app icon (homework their kids finished since they last opened the app).
//
// Environment variables (Netlify → Site configuration → Environment variables):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   the key pair for web push (see README)
//   VAPID_SUBJECT                         optional, e.g. mailto:you@example.com
//   SUPABASE_SERVICE_ROLE_KEY             already set for payments
import webpush from 'web-push';
import { SUPABASE_URL, sbSelect } from './billing.mjs';

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hello@myagenda.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  configured = true;
}

async function sbDelete(table, query) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { method: 'DELETE', headers: { apikey: key, authorization: `Bearer ${key}` } });
}

export async function sbPatch(table, query, body) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function getPrefs(parentId) {
  const rows = await sbSelect('parent_prefs', `parent_id=eq.${parentId}&select=*`);
  return rows[0] || { parent_id: parentId, notify_mode: 'each', last_seen_at: null, last_summary_at: null };
}

/** The parent's linked kids: [{ student_id, student_name, linked_at }] */
export async function kidsOf(parentId) {
  return sbSelect('parent_student_links', `parent_id=eq.${parentId}&select=student_id,student_name,linked_at`);
}

/** Homework the parent's kids finished since `since` (ISO). */
export async function finishedSince(kidIds, since) {
  if (!kidIds.length) return [];
  const ids = kidIds.map((id) => `"${id}"`).join(',');
  return sbSelect('activity', `student_id=in.(${ids})&type=eq.hw_done&created_at=gt.${encodeURIComponent(since)}&select=student_id,text,created_at&order=created_at.desc&limit=100`);
}

/** Badge number: homework finished since the parent last opened the app (or linked, if never). */
export async function badgeCount(parentId, prefs, kids) {
  const since = prefs.last_seen_at || kids.map((k) => k.linked_at).filter(Boolean).sort()[0] || new Date(Date.now() - 7 * 86400e3).toISOString();
  return (await finishedSince(kids.map((k) => k.student_id), since)).length;
}

/** Sends to every phone the parent turned notifications on for; drops dead ones. */
export async function sendToParent(parentId, payload) {
  configure();
  const subs = await sbSelect('push_subscriptions', `user_id=eq.${parentId}&select=endpoint,p256dh,auth`);
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
      sent++;
    } catch (e) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await sbDelete('push_subscriptions', `endpoint=eq.${encodeURIComponent(s.endpoint)}`);
      else console.error('push failed', parentId, e?.statusCode, e?.body || e?.message);
    }
  }
  return sent;
}

export function firstName(name) {
  return (name || '').trim().split(/\s+/)[0] || 'Your kid';
}
