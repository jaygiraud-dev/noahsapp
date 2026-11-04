// my agenda service worker: shows parent notifications and sets the red number
// on the Home Screen app icon. It doesn't cache anything.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'my agenda', body: event.data ? event.data.text() : '' }; }
  const badge = Number(data.badge) || 0;
  event.waitUntil((async () => {
    if (self.navigator.setAppBadge) {
      try { badge > 0 ? await self.navigator.setAppBadge(badge) : await self.navigator.clearAppBadge(); } catch {}
    }
    await self.registration.showNotification(data.title || 'my agenda', {
      body: data.body || '',
      icon: '/apple-touch-icon.png',
      badge: '/favicon.png',
      tag: 'kid-progress',
      renotify: true,
      data: { url: data.url || '/' },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) { if ('focus' in w) { await w.focus(); return; } }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
