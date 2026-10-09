# ChromeExtensionsPanel

`core/shell/ui/settings/ChromeExtensionsPanel.js` (ES module)

Settings > Extensions > Chrome Extensions: install unpacked, enable, disable, remove, and the Electron limitations notes.

## Methods

- `new ChromeExtensionsPanel(container)`, `load()`: `core.chromeExtensions.list`,
  `.pickFolder`, `.installUnpacked(path)`, `.toggle(id, enabled)`,
  `.remove(id)` (after a confirm); re-renders after every change.

## Globals

Reads `window.ipcBridge.invoke`, `window.LumaModal` (through Dialogs).
