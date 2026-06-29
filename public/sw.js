self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response(
        'Du bist offline. HomeGym funktioniert am besten mit aktiver Verbindung.',
        {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }
      );
    })
  );
});
