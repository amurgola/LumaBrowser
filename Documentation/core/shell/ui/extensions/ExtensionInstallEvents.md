# ExtensionInstallEvents

`core/shell/ui/extensions/ExtensionInstallEvents.js` (ES module)

Brings hot-installed extensions to life without a restart, and tears down deleted ones, from the main process broadcasts.

## Methods

- `new ExtensionInstallEvents({ host, meta, onListChanged })`, `subscribe()` (once).
- `core.shell.extensionInstalled { id }`: refresh the list; a live old renderer
  is disabled and purged (an update); enable; `onListChanged()`.
- `core.shell.extensionDeleted { id }`: disable, drop the row, `onListChanged()`.
  Failures are logged as warnings.

## Globals

Reads `window.ipcBridge.on`.
