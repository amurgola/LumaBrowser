# sw.js

`core/network-sharing/webapp/public/sw.js`

The web client's service worker (class `ServiceWorkerCache`, run on `self`).
CLASSIC-SCRIPT EXCEPTION: it imports nothing, and classic workers register in
every browser that runs the PWA, while module service workers
(`register(url, { type: 'module' })`) are not supported everywhere. It is a
worker script, never imported by a page module.

## Behaviour

- install: precaches `ServiceWorkerCache.SHELL` (`./`, `index.html`, `pair.css`,
  `web-overrides.css`, `js/web/entry.js`, `manifest.webmanifest`, `icon.png`)
  into `luma-web-v12`, then `skipWaiting()`. The other modules and the reused
  `/llm-ui/*` assets are cached on first fetch, so a missing optional asset
  cannot fail the install.
- activate: deletes every other cache, then `clients.claim()`.
- fetch: non-GET and `/sharing/*` are left alone (the live API is never cached).
  Navigations are network-first with the cached `index.html` offline. Everything
  else is network-first, caching same-origin OK responses and falling back to the
  cache offline (a cache-first shell once pinned installed clients to stale
  transport code).
