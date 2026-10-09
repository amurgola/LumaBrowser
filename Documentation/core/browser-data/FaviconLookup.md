# FaviconLookup

`core/browser-data/FaviconLookup.js`

Answers the renderer's favicon lookups from [FaviconCache](../browser/FaviconCache.md).

## Methods

- `new FaviconLookup(faviconCache)`; the cache may be null.
- `get(host)`: the data URL for the lowercased host, or null (always null without a cache).
- `getMany(hosts)`: `{ [host]: dataUrl|null }` for the lowercased hosts; a
  non-array is treated as empty; `{}` without a cache.
