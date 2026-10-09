# UpdateControls

`core/shell/ui/settings/UpdateControls.js` (ES module)

Settings > About > Updates: the auto-check switch, Check now, the live status line and progress, Restart and install.

## Methods

- `UpdateControls.describe(state, detail)` -> `{ text, dot, progress, install }`
  for `checking`, `up-to-date`, `available`, `downloading` (`detail.percent`),
  `downloaded`, `error`, `docker`, anything else (detail as text).
- `new UpdateControls(hooks)`, `wire()` (needs `window.electronAPI` and the
  About update elements), `setState(state, detail)` (`idle` hides the row; Check
  now is disabled while checking, available or downloading). Install confirms,
  then `core.app.installUpdate`.

## Globals

Reads `window.electronAPI` (getAutoCheckUpdates, setAutoCheckUpdates, checkForUpdates, onUpdateStatus), `window.ipcBridge.invoke`.
