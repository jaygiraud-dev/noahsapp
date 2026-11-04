import { Platform } from 'react-native';
import { supabase } from './supabase';

export type NotifyMode = 'each' | 'daily' | 'off';

/** Where this device stands for parent notifications and the app-icon number. */
export type PushStatus =
  | 'unsupported'      // not the web app, or an old browser
  | 'needs_home_screen' // iPhone/iPad in Safari: only works once saved to the Home Screen
  | 'blocked'           // the parent said no; only phone Settings can undo it
  | 'off'               // can be turned on
  | 'on';

const isWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && typeof navigator !== 'undefined';

function isIOS(): boolean {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator as any).maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (navigator as any).standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!isWeb()) return 'unsupported';
  if (isIOS() && !isStandalone()) return 'needs_home_screen';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission !== 'granted') return 'off';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    return sub ? 'on' : 'off';
  } catch {
    return 'off';
  }
}

function keyToBytes(base64url: string): Uint8Array {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export type EnableResult = { ok: true } | { ok: false; error: 'denied' | 'not_configured' | 'unsupported' | 'failed' };

/** Asks permission, subscribes this phone and saves it to the account. Call from a tap. */
export async function enablePush(): Promise<EnableResult> {
  if (!isWeb() || !('serviceWorker' in navigator) || !('PushManager' in window)) return { ok: false, error: 'unsupported' };
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, error: 'denied' };
  try {
    const keyRes = await fetch('/.netlify/functions/push-key');
    const { publicKey } = await keyRes.json().catch(() => ({}));
    if (!keyRes.ok || !publicKey) return { ok: false, error: 'not_configured' };
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription())
      ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) as unknown as BufferSource }));
    const json = sub.toJSON() as any;
    const { error } = await supabase.rpc('save_push_subscription', { p_endpoint: sub.endpoint, p_p256dh: json.keys?.p256dh, p_auth: json.keys?.auth });
    if (error) { console.warn('[push] save:', error.message); return { ok: false, error: error.message.includes('function') ? 'not_configured' : 'failed' }; }
    return { ok: true };
  } catch (e: any) {
    console.warn('[push] enable:', e?.message);
    return { ok: false, error: 'failed' };
  }
}

/** Parent opened the app: clear the red number here and on the server. */
export async function markParentSeen(): Promise<void> {
  if (isWeb() && (navigator as any).clearAppBadge) (navigator as any).clearAppBadge().catch(() => {});
  supabase.rpc('mark_parent_seen').then(({ error }) => { if (error) console.warn('[push] seen:', error.message); });
}

export async function getNotifyMode(parentId: string): Promise<NotifyMode> {
  const { data } = await supabase.from('parent_prefs').select('notify_mode').eq('parent_id', parentId).maybeSingle();
  return (data?.notify_mode as NotifyMode) ?? 'each';
}

export async function setNotifyMode(mode: NotifyMode): Promise<boolean> {
  const { error } = await supabase.rpc('set_notify_mode', { p_mode: mode });
  return !error;
}

/** Kid side: after finishing homework, let parents' phones know. */
export async function pingParents(): Promise<void> {
  if (!isWeb()) return;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  fetch('/.netlify/functions/notify-parents', { method: 'POST', headers: { authorization: `Bearer ${token}` } }).catch(() => {});
}
