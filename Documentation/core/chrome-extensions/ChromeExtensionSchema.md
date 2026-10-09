# ChromeExtensionSchema

`core/chrome-extensions/ChromeExtensionSchema.js`

Creates the `chrome_extensions` table (if missing) that records installed
Chrome extensions: `id` (primary key), `name`, `version`, `path`,
`manifest_version`, `enabled` (default 1), `installed_at` (epoch ms), `source`.

## Methods

- `ChromeExtensionSchema.ensure(db)` runs the DDL on a better-sqlite3 handle. Idempotent.
- `ChromeExtensionSchema.DDL` the statement itself.

## Why

Electron's `session.loadExtension()` does not persist across restarts, so the
app keeps its own record and replays the loads into every session at startup.
