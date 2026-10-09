# AppContext

`app/AppContext.js`

The shared state of one app run. The composition classes read late-bound values
(the window, the tab manager, the agent dependencies) through it.

## Fields

- From the constructor `{ electron, rootDir, env, argv, proc }`: those, plus
  `isDev` (`--dev` or an unpackaged app), `startHidden` (`--hidden`) and
  `isolatedDataDir` (a non-empty `LUMA_DATA_DIR`: tests, harnesses, docker, dev
  smoke boots; such a run must not touch machine-wide installs like the `luma`
  launcher or the IDE plugins).
- Set during boot: `boot` ([BootClock](BootClock.md)), `dataDir`, `apiPort`
  (default 3000), `apiEnabled` (default true), `services` (every built service by
  name, see [AppServices](services/AppServices.md)), `renderers`, `desktopNotice`,
  `routers` (`{ chat, image, video, music }`).
- Window time: `mainWindow`, `mainWindowController`, `tray`, `rendererRecovery`,
  `quitController`, `tabViewManager`, `tabManager`, `chromeOverlay`,
  `tabPreviewManager`, `onDemandOverlay`, `browserService`, `heavyServices`,
  `deferredServices`, `identityReady` (a promise), `agentDeps`.

## Methods

- `app` (getter) is `electron.app`.
- `liveWindow()` the main window unless missing or destroyed, else null.
- `gatewayOrigin()` `http://127.0.0.1:<apiPort>`; `webBase()` the same while the
  API is on, else null.
- `path(...parts)` under `rootDir`; `iconPath()` `<root>/icon/icon.png`.
- `notifyModelStatus(message, type)` sends `model-status` `{ message, type }` to
  the live window (the notification log); a no-op before the window exists.
