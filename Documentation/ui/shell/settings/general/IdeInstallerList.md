# IdeInstallerList

`ui/shell/settings/general/IdeInstallerList.js`

One integration list (JetBrains plugin, VS Code extension or Windhawk mods): a row per target with Install / Remove, install-everywhere and rescan. A config with `copy.updateInPlace` (Windhawk) adds an Update button to stale rows and uses `copy.staleText`; `copy.installedVerb` switches the outcome wording to "N mods installed into Windhawk". The status may carry `emptyReason` (shown when the list is empty) and `summary` (appended to the help text); a row's `description` becomes its tooltip.

## Methods

- `install()`, `load()`, `run(op, ids)`.
- `JETBRAINS`, `VSCODE`, `WINDHAWK`, `outcome(op, r, copy)`, `stateText(ide, sourceVersion, copy)` (static).

## Globals

Reads `window.ipcBridge.invoke('core.settings.<ns>.*')`.
