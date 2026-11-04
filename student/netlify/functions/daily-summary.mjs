// Runs every evening (~6:30 PM Vancouver). Parents who chose "Daily summary" get one
// notification with how much their kids finished, and the red number on the app icon.
import { json, missingConfig, sbSelect } from '../lib/billing.mjs';
import { kidsOf, finishedSince, badgeCount, sendToParent, sbPatch, firstName } from '../lib/push.mjs';

export async function sendDailySummaries(now = new Date()) {
  const parents = await sbSelect('parent_prefs', 'notify_mode=eq.daily&select=*');
  let sent = 0;
  for (const prefs of parents) {
    const kids = await kidsOf(prefs.parent_id);
    if (!kids.length) continue;
    const dayAgo = new Date(now.getTime() - 24 * 3600e3).toISOString();
    const since = [prefs.last_summary_at, dayAgo].filter(Boolean).sort().pop();
    const done = await finishedSince(kids.map((k) => k.student_id), since);
    if (!done.length) continue;
    const names = [...new Set(done.map((d) => firstName(kids.find((k) => k.student_id === d.student_id)?.student_name)))];
    const who = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    const badge = await badgeCount(prefs.parent_id, prefs, kids);
    sent += await sendToParent(prefs.parent_id, {
      title: `✓ ${who} finished ${done.length} task${done.length === 1 ? '' : 's'} today`,
      body: done.slice(0, 3).map((d) => d.text.replace(/^Finished\s+/, '')).join(' · '),
      badge,
      url: '/',
    });
    await sbPatch('parent_prefs', `parent_id=eq.${prefs.parent_id}`, { last_summary_at: now.toISOString() });
  }
  return { sent };
}

export default async () => {
  const bad = missingConfig('SUPABASE_SERVICE_ROLE_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY');
  if (bad) return bad;
  return json(200, await sendDailySummaries());
};

export const config = { schedule: '30 1 * * *' }; // 01:30 UTC ≈ 6:30 PM Vancouver
