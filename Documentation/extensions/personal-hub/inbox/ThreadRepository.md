# ThreadRepository

`extensions/personal-hub/inbox/ThreadRepository.js`

Plain queries over `hub_threads`: the conversation queue, one row per
`(app, thread key)` that notifications roll up into, carrying the user's
review state and whatever an automation enriched it with.

## Methods

- `STATES` (open, reviewed, snoozed, done), `PRIORITIES` (low, normal, high, urgent).
- `get(id)`, `findByKey(app, threadKey)`.
- `insert(row)`, `update(id, columns)` (arrays and objects serialised).
- `list({ state = 'open', app, limit, offset, nowIso })`: `open` also returns
  snoozed threads whose `snooze_until` has passed; `all` returns every state.
- `countByState()`, `delete(id)`.
- `static hydrate(row)`.
