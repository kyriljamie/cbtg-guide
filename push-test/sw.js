// CBTG reminders service worker: shows the reminder and opens the page when tapped.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  const title = d.title || 'CBTG reminder';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: '../img/apple-touch-icon.png',
    badge: '../img/favicon-48.png',
    tag: d.tag || 'cbtg',
    renotify: true,
    data: { url: new URL(d.url || './?done=1', self.registration.scope).href },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) { await c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  })());
});
