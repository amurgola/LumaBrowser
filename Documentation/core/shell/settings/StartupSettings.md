# StartupSettings

`core/shell/settings/StartupSettings.js`

Run on startup and "start hidden".

## Methods

- `new StartupSettings({ db, app })` with electron's `app`.
- `getRunOnStartup()` `app.getLoginItemSettings().openAtLogin`.
- `setRunOnStartup(enabled)` registers the login item with the stored hidden
  choice: `{ openAtLogin, openAsHidden, args: hidden ? ['--hidden'] : [] }`.
- `getConfig()` `{ openAtLogin, startHidden }` as booleans.
- `setStartHidden(hidden)` stores `core.app.startHidden` and re-registers the
  login item only when it is on.
- Statics: `START_HIDDEN_KEY`, `HIDDEN_ARG`.

## Why

"Start hidden" is a separate, persisted preference so the user can see and
change whether a login launch shows a window or only the tray icon. It defaults
to hidden, the behaviour before the preference existed.
