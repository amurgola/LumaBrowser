# TabShareList

`extensions/tab-share/TabShareList.js`

The persisted list of tab shares (key `shares`). Each share binds an
unguessable token to one tab and remembers the tab's partition and URL so it
can re-bind after a restart.

## Methods

- `TabShareList.TOKEN_RE` (`^[a-f0-9]{32}$`), `MODES` (`view`, `interact`),
  `isToken(t)`, `isMode(m)`.
- `TabShareList.create(entry, mode)`: `{ id: 'ts_<time36>_<hex6>', token
  (16 random bytes hex), tabId, partition, url, title, mode, createdAt,
  persistedBefore }`; `persistedBefore` records whether the tab was already
  kept alive (so stopping only undoes what sharing did).
- `new TabShareList({ db, log })`; `all()`, `byTab(id)`, `byId(id)`,
  `byToken(t)`, `dormantIn(partition)`, `add(share)`, `remove(id)`, `save()`.
- `load()`: drops entries with a bad token or mode, and sets every `tabId` to
  null: tab ids never survive a restart, so every share starts dormant.
