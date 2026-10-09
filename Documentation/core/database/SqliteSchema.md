# SqliteSchema

`core/database/SqliteSchema.js`

Idempotent in-place schema migrations, safe to run on every boot.

## Methods

- `SqliteSchema.ensureColumn(db, table, column, ddl)` adds the column when it
  is missing and returns true; returns false when it already exists. `ddl` is
  the column definition, e.g. `'TEXT'` or `'INTEGER DEFAULT 0'`.
- `SqliteSchema.hasColumn(db, table, column)` is true when the column exists.

## Why

Existence is probed with a zero-row `SELECT column FROM table LIMIT 0` rather
than schema introspection, because that behaves identically on every SQLite
version the app has shipped against.

Nothing in the legacy repo called `ensureColumn` yet. It was written to
collapse the hand-written "add column if missing" idioms in SettingsDatabase,
which [SettingsMigrations](settings/SettingsMigrations.md) now does.
