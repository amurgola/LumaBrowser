# SettingsRepository

`core/database/settings/SettingsRepository.js`

Raw SQL over the `settings` key-value table. Reached through
[SettingsDatabase](../SettingsDatabase.md).

## Methods

- `get(key, defaultValue = null)`, `set(key, value)`, `delete(key)`, `has(key)`.
  Values go through [SettingsValueCodec](SettingsValueCodec.md).
- `getAllKeysWithPrefix(prefix)` returns `{ fullKey: value }` for keys
  starting with `prefix` (SQL `LIKE prefix%`).
- `migrateKeys([{ from, to }])` renames keys in one transaction. An existing
  `to` wins and `from` is just deleted; a missing `from` is skipped. Returns
  how many keys were handled.
- `replacePathPrefix(oldPrefix, newPrefix)` rewrites every stored value
  containing the prefix (see [PathPrefixRewrite](PathPrefixRewrite.md)) and
  returns the number of rows changed. Equal or empty prefixes do nothing.

## Why replacePathPrefix

After AppPaths relocates the managed models and runtimes base, persisted
absolute paths (default model path, runtime caches) must follow the files.
