class ServiceWorkerCache {
  static CACHE = 'luma-web-v12';
  static SHELL = ['./', 'index.html', 'pair.css', 'web-overrides.css', 'js/web/entry.js', 'manifest.webmanifest', 'icon.png'];
  static API_PREFIX = '/sharing/';

  constructor(scope) {
    this._scope = scope;
  }

  install() {
    this._scope.addEventListener('install', (event) => event.waitUntil(this._precache()));
    this._scope.addEventListener('activate', (event) => event.waitUntil(this._dropOldCaches()));
    this._scope.addEventListener('fetch', (event) => this._onFetch(event));
  }

  _precache() {
    return this._scope.caches.open(ServiceWorkerCache.CACHE)
      .then((c) => c.addAll(ServiceWorkerCache.SHELL))
      .then(() => this._scope.skipWaiting());
  }

  _dropOldCaches() {
    const caches = this._scope.caches;
    return caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== ServiceWorkerCache.CACHE).map((k) => caches.delete(k))))
      .then(() => this._scope.clients.claim());
  }

  _onFetch(event) {
    const req = event.request;
    const url = new URL(req.url);
    if (req.method !== 'GET' || url.pathname.startsWith(ServiceWorkerCache.API_PREFIX)) return;
    if (req.mode === 'navigate') {
      event.respondWith(this._scope.fetch(req).catch(() => this._scope.caches.match('index.html')));
      return;
    }
    event.respondWith(this._networkFirst(req, url));
  }

  _networkFirst(req, url) {
    const caches = this._scope.caches;
    return this._scope.fetch(req).then((res) => {
      if (res && res.ok && url.origin === this._scope.location.origin) {
        const copy = res.clone();
        caches.open(ServiceWorkerCache.CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req));
  }
}

new ServiceWorkerCache(self).install();
