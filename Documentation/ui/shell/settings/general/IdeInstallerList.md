# IdeInstallerList

`ui/shell/settings/general/IdeInstallerList.js`

One IDE-integration list (JetBrains plugin or VS Code extension): a row per editor with Install / Remove, install-everywhere and rescan.

## Methods

- `install()`, `load()`, `run(op, ids)`.
- `JETBRAINS`, `VSCODE`, `outcome(op, r, copy)`, `stateText(ide, sourceVersion, copy)` (static).

## Globals

Reads `window.ipcBridge.invoke('core.settings.<ns>.*')`.
