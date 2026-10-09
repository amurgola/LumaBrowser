# AdblockerService

`core/adblocker/AdblockerService.js`

The native ad and tracker blocker. Applies a `@ghostery/adblocker-electron`
engine to browsing sessions through `session.webRequest`.

## Methods

- `new AdblockerService(settingsDb, dataDir)`; reads `core.adblocker.enabled`
  (default true). The compiled engine is cached at `<dataDir>/adblocker-engine.bin`.
- `isEnabled()` the current switch.
- `hasEngine()` whether a filter engine has been built.
- `init()` builds the engine (in a worker, see FilterWorkerLauncher) when enabled;
  does nothing when disabled. Never throws: a failed build is logged and leaves
  no engine, so a later `init` or `setEnabled(true)` retries.
- `applyToSession(sess)` remembers the session and enables blocking on it when
  enabled and an engine exists. Idempotent per session.
- `setEnabled(enabled)` persists the switch, builds the engine on first enable,
  then enables or disables blocking on every known session, every live
  webContents' session and the default session.
- `ready` a plain flag main.js sets after `init()` resolves; read by its
  `session-created` hook.
- `AdblockerService.SETTING_KEY`, `CACHE_FILE`, `GHOSTERY_IPC_CHANNELS`.

## Why

Electron does not implement `chrome.webRequest`, so Chrome extensions like
uBlock Origin cannot block requests. Ghostery's adapter uses
`session.webRequest` directly, which Electron does support.

The engine is built in a worker so a multi-megabyte list compile never blocks
the main process. Concurrent `init`/`setEnabled` calls share one build. A
session seen while the build runs still gets blocking when it finishes, and
disabling mid-build means the finished engine attaches nothing.

`enableBlockingInSession` registers handlers on the global `ipcMain`, so
blocking a second session throws "Attempted to register a second handler"
unless those channels are removed first; `applyToSession` clears them each time.
