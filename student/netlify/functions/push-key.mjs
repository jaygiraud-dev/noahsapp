// GET /.netlify/functions/push-key → { publicKey } so the app can turn on notifications.
import { json } from '../lib/billing.mjs';

export default async () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return json(503, { error: 'not_configured' });
  return json(200, { publicKey });
};
