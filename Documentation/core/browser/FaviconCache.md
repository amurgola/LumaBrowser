# FaviconCache

`core/browser/FaviconCache.js`

Per-hostname favicon cache. Fetches each site's icon once (from the URL the page
reported via `page-favicon-updated`), stores it as a data URL in a JSON file under
userData, and serves it to the bookmarks bar, history view and omnibox.

## Methods

- `new FaviconCache({ filePath, maxEntries = 2000, fetchImpl, timeoutMs = 5000, maxBytes = 65536 })`
  loads the file if present (a missing or corrupt file starts empty). `filePath`
  null keeps it in memory only. Fetch options go to FaviconFetcher.
- `FaviconCache.hostOf(url)` lowercase hostname, or null.
- `get(host)` data URL or null; a hit counts as use for LRU.
- `getMany(hosts)` `{ [host]: dataUrl|null }`.
- `getForUrl(url)` `get(hostOf(url))`.
- `record(pageUrl, faviconUrl)` fetches and stores the icon unless the host already
  has one from the same source; concurrent records for one host share one fetch.
  Resolves to the data URL or null; never throws.
- `flush()` writes pending changes now (call on quit).
- Event `'favicon'` `{ host, dataUrl }` when a new icon lands, so the renderer can
  repaint rows already on screen.
- `entries` is the public LRU map (insertion order is LRU order).

## Why

Before this cache every bookmark, history and suggestion row asked DuckDuckGo's
icon service for the hostname, which leaked browsing history to a third party and
drew nothing offline.

Only `http(s)` and `data:image/` sources are accepted: pages without an icon report
an empty `data:,`, which must never be cached. Writes are debounced by 1.5 s and
the timer is unref'd so it never holds the process open.
