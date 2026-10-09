# NotificationRepository

`extensions/personal-hub/inbox/NotificationRepository.js`

Plain queries over `hub_notifications`: the full, persistent log of
intercepted web notifications (the Notifications extension keeps only the
newest fifty in a settings value), each tagged with the app and thread it
belongs to.

## Methods

- `insert(row)` with `{ id, receivedAt, app, host, partition, tabTitle, title,
  body, url, tag, sender, threadKey, threadId, dedupeKey, data }`; `get(id)`.
- `hasDedupe(dedupeKey, sinceIso)`: the same key logged at or after `sinceIso`.
- `listForThread(threadId, { limit })`, `listRecent({ limit, offset, app, since })`
  (newest first; `app` narrows to one app, `since` to rows received at or
  after that ISO time), `count()`.
- `pruneBefore(beforeIso)`: drops older rows, returns how many.
- `static hydrate(row)`.
