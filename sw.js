/* 정처기 CBT · 오프라인 캐시 */
const CACHE = 'jbgisa-cbt-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 앱 화면: 네트워크 우선, 실패 시 캐시 (업데이트 반영 + 오프라인 대응)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => {
        caches.open(CACHE).then(c => c.put('./index.html', r.clone()));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 그 외(아이콘·폰트 등): 캐시 우선, 없으면 받아서 저장
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') {
        caches.open(CACHE).then(c => c.put(req, r.clone()));
      }
      return r;
    }).catch(() => hit))
  );
});
