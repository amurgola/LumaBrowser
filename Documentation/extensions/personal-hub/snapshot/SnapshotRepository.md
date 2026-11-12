# SnapshotRepository

`extensions/personal-hub/snapshot/SnapshotRepository.js`

Plain queries over `hub_snapshots`: the text of a conversation as last read
from its tab, one row per activity item, with where it was read from and
which activity it reflects, so it is only read again after something new
([ConversationReader](ConversationReader.md)).

## Methods

- `new SnapshotRepository(db)`: `db` is the extension's DatabaseService.
- `get(threadId)` -> the row or `null`.
- `forThreads(threadIds)` -> `{ <threadId>: snapshot }` for the ids that
  have one, in one query; an empty list answers `{}`.
- `save({ threadId, scope, url, text, sourceAt })`: replaces the item's
  snapshot, stamps `taken_at` and returns the row.
- `delete(threadId)` -> whether a row went.
- `static hydrate(row)`.

Rows hydrate to `{ threadId, scope, url, text, sourceAt, takenAt }`. `scope`
is `conversation` (the item's own address was opened) or `tab` (the user's
tab was read where it stood), `url` the address read, and `sourceAt` the
item's `lastAt` at the time of the read: a snapshot is fresh while the two
still match.

## Why

`save` is an update or an insert in two statements, because the extension
database's table scan misreads `ON CONFLICT ... DO UPDATE SET`.
