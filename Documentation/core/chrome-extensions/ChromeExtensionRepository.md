# ChromeExtensionRepository

`core/chrome-extensions/ChromeExtensionRepository.js`

Raw SQL over the `chrome_extensions` table
([ChromeExtensionSchema](ChromeExtensionSchema.md)). Returns rows with their
column names (`manifest_version`, `installed_at`, integer `enabled`).

## Methods

- `new ChromeExtensionRepository(db)` takes a better-sqlite3 handle.
- `list()` every row, newest `installed_at` first.
- `listEnabled()` rows with `enabled = 1`.
- `get(id)` one row or `null`.
- `upsert(row)` inserts, or on an existing id updates every column and
  re-enables it.
- `setEnabled(id, enabled)` stores 1 or 0.
- `remove(id)` deletes the row.
