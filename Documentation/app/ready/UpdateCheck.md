# UpdateCheck

`app/ready/UpdateCheck.js`

The auto-updater and its checks.

## Methods

- `new UpdateCheck({ getWindow, db, env, isDev, createUpdater? })`; `createUpdater(win)`
  defaults to `new Updater(win)` ([Updater](../../core/shell/Updater.md), loaded on first use).
- `ensure()` the updater, created once a window exists; null in Docker
  (`LUMA_DOCKER`) or before the window.
- `autoCheck()` the startup check: skipped in dev or when
  `core.app.autoCheckUpdates` is false (then the update server is never contacted).
- `manualCheck()` `{ ok: true }`, or `{ ok: false, reason }` with `docker`,
  `not-ready` or the thrown message. Works regardless of the preference.
- `register(ipcMain)` handles `core.app.checkForUpdates` with `manualCheck`.
