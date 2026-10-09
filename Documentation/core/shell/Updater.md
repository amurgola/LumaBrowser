# Updater

`core/shell/Updater.js`

Owns the auto-update lifecycle on top of `electron-updater`.

## Methods

- `new Updater(mainWindow)` configures `autoUpdater` (logger `electron-log` at
  `info`, `autoDownload` and `autoInstallOnAppQuit` on), subscribes to its
  events, and registers the `core.app.installUpdate` IPC handler once per
  process.
- `checkForUpdates()` starts a check; a synchronous throw is logged, not raised.

## Renderer messages

- `core.app.update-status` `{ status, detail }` where `status` is `checking`,
  `available` (detail = version), `up-to-date` (version), `error` (message),
  `downloading` (`{ percent, transferred, total }`, percent rounded and clamped
  to 0..100) or `downloaded` (version).
- `core.app.update-available` carries the raw updater `info`.
- `core.app.installUpdate` (invoke) runs `quitAndInstall` and returns
  `{ ok: true }` or `{ ok: false, reason }`. It backs the About panel's
  "Restart to install" button.

After `update-downloaded` a dialog offers "Restart and Install" or "Later";
Later leaves the install to the next quit.

## Why

The IPC handler is registered here, not in `main.js`, so the updater owns its
whole lifecycle; the static guard stops a second instance double-registering.
`main.js` creates the instance lazily (electron-updater is slow to load) and
skips it entirely under `LUMA_DOCKER`.
