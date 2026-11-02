// CBTG reminders service worker: shows the reminder and opens the page when tapped.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'CBTG reminder', {
    body: d.body || '',
    icon: '../img/apple-touch-icon.png',
    badge: '../img/favicon-48.png',
    tag: d.tag || 'cbtg',
    renotify: true,
    requireInteraction: true,
    data: { url: new URL(d.url || './', self.registration.scope).href },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      try { const n = await c.navigate(url); if (n) return n.focus(); } catch (x) { /* not ours: open a new one */ }
    }
    return self.clients.openWindow(url);
  })());
});
