# MonitorSchema

`extensions/page-change-detector/MonitorSchema.js`

Creates `page_change_monitors` and `page_change_history`, adds the columns
later releases introduced, and resets a `checking` status left by a check the
app closed during.

## Methods

- `MonitorSchema.ensure(db)`: `db` is the extension's DatabaseService.
- Statics `MONITORS_TABLE`, `HISTORY_TABLE`, `ADDED_COLUMNS`.

## Why

SQLite has no `ADD COLUMN IF NOT EXISTS`, so each `ALTER TABLE` is attempted
and a "duplicate column" error skipped. The SQL is unchanged so existing user
databases keep working.
