// POST /.netlify/functions/notify-parents   (called by the kid's app after finishing homework)
// Looks up what the kid just finished (from the database, not from the request, so
// nobody can send their parents made-up messages) and notifies parents who chose
// "every finished task", with the red number on the app icon.
import { json, missingConfig, userFromRequest, getRole, sbSelect } from '../lib/billing.mjs';
import { getPrefs, kidsOf, badgeCount, sendToParent, firstName } from '../lib/push.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });
  const bad = missingConfig('SUPABASE_SERVICE_ROLE_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY');
  if (bad) return bad;

  const user = await userFromRequest(req);
  if (!user) return json(401, { error: 'not_signed_in' });
  if ((await getRole(user.id)) !== 'student') return json(403, { error: 'not_a_student' });

  const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const [latest] = await sbSelect('activity', `student_id=eq.${user.id}&type=eq.hw_done&created_at=gt.${encodeURIComponent(since)}&select=text&order=created_at.desc&limit=1`);
  if (!latest) return json(200, { sent: 0, reason: 'nothing_new' });

  const links = await sbSelect('parent_student_links', `student_id=eq.${user.id}&select=parent_id,student_name`);
  let sent = 0;
  for (const link of links) {
    const prefs = await getPrefs(link.parent_id);
    if (prefs.notify_mode !== 'each') continue;
    const kids = await kidsOf(link.parent_id);
    const badge = await badgeCount(link.parent_id, prefs, kids);
    sent += await sendToParent(link.parent_id, {
      title: `✓ ${firstName(link.student_name)} finished homework`,
      body: latest.text.replace(/^Finished\s+/, ''),
      badge,
      url: '/',
    });
  }
  return json(200, { sent });
};
