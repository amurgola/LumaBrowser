# RestartNotes

`ui/shell/settings/general/RestartNotes.js`

"Restart required" notes get a "Restart now" action (confirm, then `core.settings.relaunch`).

## Methods

- `install()`.
- `RestartNotes.hideAll()`, `RestartNotes.show(id)`.

## Globals

Reads `window.ipcBridge.invoke`.
