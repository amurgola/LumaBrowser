# SqliteOpener

`core/database/SqliteOpener.js`

Opens every SQLite database in the app the same way: better-sqlite3, WAL
journaling and a busy timeout.

## Methods

- `SqliteOpener.open(dbPath, { busyTimeoutMs = 5000, mkdir = false, readOnly = false })`
  returns an open better-sqlite3 handle. `dbPath` may be `':memory:'`; an
  empty path throws. `mkdir` creates the parent directory first (ignored for
  memory). `busyTimeoutMs: 0` means fail immediately on a locked database.
  `readOnly` opens an existing file (`readonly`, `fileMustExist`) without the
  WAL switch, which would need a writable directory: the way a prebuilt
  database shipped in the app's resources is opened
  ([ReadOnlyRagStore](../rag/ReadOnlyRagStore.md)). `mkdir` is ignored then.
- `SqliteOpener.DEFAULT_BUSY_TIMEOUT_MS` is 5000.

## Why

WAL is not optional: every one of these databases is read by one process while
another writes it. The one exception is a read-only file nobody writes, which
is why `readOnly` skips the switch instead of failing on a read-only folder.

The timeout is passed through the constructor's `timeout` option because that
is the knob better-sqlite3 actually uses for `busy_timeout`. Legacy bug L8
claimed the RAG store had no busy timeout; it was refuted (better-sqlite3
defaults to 5000 itself) and a test pins that evidence.
