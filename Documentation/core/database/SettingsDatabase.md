# SettingsDatabase

`core/database/SettingsDatabase.js`

The app's central SQLite database (`settings.db` in userData): key-value
settings plus the core feature tables. A facade: it opens the file, applies
[SettingsSchema](settings/SettingsSchema.md), and routes each call to the
repository for its table.

## Methods

- `new SettingsDatabase(dbPath)` opens through [SqliteOpener](SqliteOpener.md)
  (WAL, 5 s busy timeout; `':memory:'` works for tests) and applies the schema.
- `db` is the public better-sqlite3 handle. Feature stores (ChatStore,
  HistoryStore, BookmarkStore, ...) borrow it through
  [StoreHandle](StoreHandle.md).
- Settings ([SettingsRepository](settings/SettingsRepository.md)): `get(key,
  default = null)`, `set(key, value)`, `delete(key)`, `has(key)`,
  `getAllKeysWithPrefix(prefix)`, `migrateKeys([{ from, to }])`,
  `replacePathPrefix(oldPrefix, newPrefix)`.
- Network watchers ([NetworkWatcherRepository](settings/NetworkWatcherRepository.md)):
  `addWatcher`, `hasWatcher`, `updateWatcher`, `removeWatcher`, `getAllWatchers`.
- `close()`.

## Why a facade

Every caller (main.js, DatabaseService, the stores) uses the
one object, so the public surface stays exactly the legacy one while each
table's SQL lives in its own small repository.
