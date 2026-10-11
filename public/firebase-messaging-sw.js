// AERIS · Firebase Cloud Messaging & Web Push Service Worker
// Enables system background notifications on Desktop & Mobile (Android & iOS PWA)

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'AERIS Gas Alarm', body: event.data.text() };
    }
  }

  const title = data.title || 'AERIS · High Gas Detection Warning';
  const options = {
    body: data.body || 'MQ-2 sensor threshold breached on ESP32 device.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'aeris-critical-alarm',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 400],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Open Dashboard' },
      { action: 'dismiss', title: 'Acknowledge' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus open window if exists
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
