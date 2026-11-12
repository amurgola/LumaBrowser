# ThreadRepository

`extensions/personal-hub/inbox/ThreadRepository.js`

Plain queries over `hub_threads`: the activity feed, one row per
`(app, thread key)` that notifications roll up into, carrying whether the
user dismissed it and whatever an automation enriched it with.

## Methods

- `STATES` (open, reviewed, snoozed, done), `PRIORITIES` (low, normal, high, urgent).
- `get(id)`, `findByKey(app, threadKey)`.
- `insert(row)`, `update(id, columns)` (arrays and objects serialised).
- `list({ state = 'active', app, limit, offset, since, nowIso })`, newest
  `last_at` first: `active` (the feed) is everything not dismissed (`done`)
  and not snoozed into the future; `open` also returns snoozed threads whose
  `snooze_until` has passed; `all` returns every state; any other state
  matches exactly. `since` (ISO) keeps threads whose `last_at` is at or after
  it.
- `countByState()`, `delete(id)`.
- `static hydrate(row)`.
