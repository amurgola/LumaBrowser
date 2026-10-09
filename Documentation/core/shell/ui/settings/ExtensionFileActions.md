# ExtensionFileActions

`core/shell/ui/settings/ExtensionFileActions.js` (ES module)

The Settings > Extensions actions on extension files: new from template, install .zip, export .zip, edit code, delete.

## Methods

- `new ExtensionFileActions({ meta, host, hooks, onDeleted })`.
- `createNew()` (prompt "Enter a name for the new extension:", then
  `core.shell.createExtensionTemplate` and `core.shell.openExtensionEditor`),
  `installZip()` (`core.shell.openExtensionFileDialog`,
  `core.shell.installExtension`), `export(id)` (`core.shell.exportExtension`),
  `edit(id)` (`core.shell.openExtensionEditor`), `delete(id, name)` (confirm,
  `core.shell.deleteExtension`, then disable UI, drop the row, dispatch
  `extension-toggled`, re-render). Every outcome is a toast.

## Globals

Reads `window.ipcBridge.invoke`, `window.LumaModal` (through Dialogs); dispatches `extension-toggled`.
