# DatabaseService

`core/database/DatabaseService.js`

The namespaced, table-restricted view of SettingsDatabase that each extension
receives as `context.db`.

## Methods

- `new DatabaseService(db, namespace, allowedTables = [])` wraps a
  SettingsDatabase. `namespace` is e.g. `ext.network-watcher`.
- `get(key, defaultValue = null)`, `set(key, value)`, `delete(key)` read and
  write `<namespace>.<key>` in the settings table.
- `getAll(prefix = '')` returns every setting under `<namespace>.<prefix>`
  (keys are returned in full, namespace included).
- `hasTableAccess(tableName)` is true when the manifest declared the table.
- `query(sql, ...params)` / `run(sql, ...params)` run raw SQL through
  better-sqlite3 after checking every table the SQL names is declared.
- `getRawDb()` returns the underlying SettingsDatabase (escape hatch, no checks).
- `getNamespace()` returns the namespace.
- Table-gated pass-throughs to SettingsDatabase, each throwing unless its table
  is declared:
  - `network_watchers`: `addWatcher`, `hasWatcher`, `updateWatcher`,
    `removeWatcher`, `getAllWatchers`

## Why

The SQL table check is a keyword scan (`from|into|update|join <name>`), not a
parser. It exists to stop an extension from naming a table it never declared,
not to defend against a hostile extension (which can call `getRawDb()`). The
`settings` table is always allowed. SQL is lowercased before the scan, so
declared table names must be lowercase.
