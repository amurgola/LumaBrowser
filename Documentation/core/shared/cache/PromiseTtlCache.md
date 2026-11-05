# PromiseTtlCache

`core/shared/cache/PromiseTtlCache.js`

A small memory of async answers keyed by string, for the model browsers: a fresh entry is served as is, concurrent callers of a missing key share one load, a rejected load is forgotten at once, and the oldest entry goes when the capacity is reached.

## Methods

- `new PromiseTtlCache({ ttlMs, capacity = 64, now = Date.now })`.
- `get(key, load)` the promise for `key`; `load()` runs once per fresh window, even for concurrent callers. A hit becomes the most recently used entry; a rejection is dropped so the next call retries.
- `has(key)` true for a fresh entry (loading or loaded); `delete(key)`, `clear()`, `size`.

## Why

The Hugging Face and CivitAI browsers call out per click; a short TTL turns a second look at the same repo, page or model into a memory read, and the shared promise means a hover prefetch and the click that follows it cost one request.
