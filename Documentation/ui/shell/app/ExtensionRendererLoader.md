# ExtensionRendererLoader

`ui/shell/app/ExtensionRendererLoader.js`

Loads the extension renderers through the slot manager, only once first-run setup is complete (their activate() calls main handlers that exist only after main activated the extension).

## Methods

- `new ExtensionRendererLoader({ slotManager, browserRenderer })`.
- `load()` asks main for the extension list and calls `slotManager.loadExtensions(list, { electronAPI, ipcBridge, browserRenderer, slotManager })`.
- `loadWhenSetupComplete()` loads now when setup is complete (or the flag read fails), else waits for the wizard.

## Globals

Reads `window.ipcBridge`, `window.electronAPI`.
