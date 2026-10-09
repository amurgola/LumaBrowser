# ExtensionMetaStore

`core/shell/ui/extensions/ExtensionMetaStore.js` (ES module)

The shell renderer's copy of the extension list rows.

## Methods

- `setAll(list)`, `refresh()` (re-reads `core.shell.getExtensions`), `get(id)`
  (row or null), `delete(id)`, `values()`, `enabledInLoadOrder()`,
  `displayName(id)` (name or id).

## Globals

Reads `window.ipcBridge.invoke`.
