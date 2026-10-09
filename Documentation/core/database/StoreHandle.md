# StoreHandle

`core/database/StoreHandle.js`

Guards a feature store borrowing the app-wide SQLite handle from
SettingsDatabase.

## Methods

- `StoreHandle.requireOpen(settingsDb, label)` returns `settingsDb.db`, or
  throws `"<label> requires a SettingsDatabase with an open handle"`.

## Why

Stores do not own their connection; they borrow the shared one. A store
constructed before the database is open would otherwise fail far from the
cause, inside a `prepare()` call.
