# NotificationRelay

`extensions/desktop-integration/features/notifications/NotificationRelay.js`

The work behind the [notifications feature](index.md): normalize
([OsNotification](OsNotification.md)), count the app, filter
([AppFilter](AppFilter.md)), dedupe, then push to the Hub
([HubMapper](HubMapper.md)) or buffer. Never throws on bad input.

## Constructor

`new NotificationRelay({ settings, getHub, broadcast, log, now, setTimer, clearTimer })`

- `settings`: `get(key, default)`, `set(key, value)` (the feature's `deps.settings`).
- `getHub()`: the `personal-hub` API or null, read on every request (so the Hub
  can come and go).
- `broadcast(type, payload)`: `deps.broadcast`; called with `'relayed'`.
- `now`, `setTimer`, `clearTimer`: injectable for tests.

## Methods

- `static itemsOf(body)`: a request body (object, array, `{ notifications }`) -> list or null.
- `config()`: current settings with defaults; lists parsed.
- `hubAvailable()`: a Hub with `pushQueueItem` is there.
- `ingest(list, { client })` -> `{ received, truncated, counts, results }`.
  Flushes the buffer first, then handles each item in order. At most
  `MAX_BATCH` (100) items.
- `flush()` -> `{ flushed, pending }`: buffered items to the Hub, oldest first,
  stopping at the first failure.
- `recent({ limit, status })`: newest first, up to `MAX_RECENT` (200); a row is
  `{ id, status, receivedAt, at, app, appId, hubApp, title, body (500 chars), tag, group, client, threadId, reason, error? }`.
- `apps()`: `{ app, appId, hubApp, count, relayed, buffered, filtered, duplicates, errors, firstAt, lastAt }`, newest first; at most 500 apps.
- `pendingCount()`, `dispose()` (saves the apps table if a save is pending).

## Dedupe

Key: lowercased AUMID (or app), then the group and tag when a tag is present,
else a SHA-1 of title and body. A key seen within `dedupeWindowSec` is a
duplicate. Keys are kept in memory only.
