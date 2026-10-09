# ResolutionCacheStore

`core/browser/resolution-cache/ResolutionCacheStore.js`

The [ResolutionCache](../ResolutionCache.md)'s entry store and base class.

## Methods

- `new ResolutionCacheStore({ store, maxEntries, ttlMs, maxSoftMisses, saveDelayMs, now })`.
  Public fields of the same names. Entries load lazily from
  [ResolutionCacheSnapshot](ResolutionCacheSnapshot.md) on first use when `store`
  has `get` and `set`; a load failure warns and starts empty.
- `get(key)`: the entry, moved to the most-recently-used end; an entry idle past
  `ttlMs` is removed and null returned.
- `put(key, { selector, tag?, role?, text?, rect?, source })` -> the entry
  `{ selector, tag, role, textHint, rect, source, hits, misses, created, lastUsed }`,
  evicting least-recently-used entries past `maxEntries`. Re-storing the same
  selector keeps its hits and creation time. Null without a selector.
- `delete(key)`, `clear()`.
- `noteHit(key)`: counts a hit, resets misses, refreshes `lastUsed`.
- `noteMiss(key, { hard = true, reason })`: a hard miss drops the entry; soft misses
  drop it after `maxSoftMisses` in a row.
- `stats()` -> `{ size, maxEntries, served, hits, misses, stores, evictions }`.
- `flush()`: writes now. Every change otherwise schedules one write after
  `saveDelayMs` (0 writes at once), so a burst of actions is one write.
- `ResolutionCacheStore.debug` logs each store, hit, miss and expiry.
