# StartupSettings

`core/shell/settings/StartupSettings.js`

Run on startup, "start hidden" and "restore tabs on restart".

## Methods

- `new StartupSettings({ db, app })` with electron's `app`.
- `getRunOnStartup()` true when `app.getLoginItemSettings({ args }).openAtLogin` holds for either
  registration, hidden (`['--hidden']`) or visible (`[]`). Windows compares the Run registry value against
  the executable path plus the queried args, so a query without the registered args reports `false` for a
  live login item. That left the checkbox off after a reload while the app still started with the system.
- `setRunOnStartup(enabled)` registers the login item with the stored hidden
  choice: `{ openAtLogin, args: hidden ? ['--hidden'] : [] }`. The `--hidden` argument alone
  carries the choice (Electron 44 removed `openAsHidden`, which only ever worked on macOS 12 and older).
- `getConfig()` `{ openAtLogin, startHidden, restoreTabs }` as booleans.
- `setStartHidden(hidden)` stores `core.app.startHidden` and re-registers the
  login item only when it is on.
- `setRestoreTabs(enabled)` stores `core.app.restoreTabs`
  ([SessionTabs](../../browser/tab-view/SessionTabs.md)`.ENABLED_KEY`, default off).
- Statics: `START_HIDDEN_KEY`, `HIDDEN_ARG`.

## Why

"Start hidden" is a separate, persisted preference so the user can see and
change whether a login launch shows a window or only the tray icon. It defaults
to hidden, the behaviour before the preference existed.
