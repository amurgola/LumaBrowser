# HistoryStore

`core/history/HistoryStore.js`

Typed CRUD over the `browser_history` table, declared by SettingsDatabase. Uses
that database's better-sqlite3 handle and never closes it. One row per visit;
rows come back as `{ id, url, title, visitedAt }`.

## Methods

- `new HistoryStore(settingsDb)`; throws "HistoryStore requires a SettingsDatabase
  with an open handle" when `settingsDb.db` is missing.
- `addVisit({ id?, url, title?, visitedAt? })` inserts a visit; id (`hist_...`)
  and ISO timestamp are minted unless given. Empty titles store as null.
- `updateTitle(id, title)` returns whether a row changed.
- `lastVisitedAt(url)` ISO time of the latest visit, or null.
- `list({ search='', limit=200, offset=0 })` newest first. `limit` is clamped to
  1..2000. `search` is a case-insensitive substring match on url or title.
- `suggest(query, { limit=8, scan=50 })` autocomplete: groups matching visits by
  url, scans the top `scan` by visit count, scores them, and returns the best
  `limit` (clamped 1..50) as `{ url, title, visitCount, lastVisitedAt, score }`.
  `title` is the latest non-empty one. Empty query returns `[]`.
- `deleteById(id)` boolean; `deleteByUrl(url)` rows deleted.
- `clear({ before?, since? })` deletes rows at/after `since`, or before
  `before`, or everything; returns rows deleted. `since` wins if both are given.

## Frecency

`score = 2 x visitCount + recencyBonus`, where the bonus falls linearly from
100 (visited now) to 0 (visited 30 or more days ago). SQLite only supplies the
counts and timestamps; the score is computed in JS so the recency half uses a
real "now".
