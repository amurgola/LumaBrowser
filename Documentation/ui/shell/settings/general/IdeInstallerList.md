# IdeInstallerList

`ui/shell/settings/general/IdeInstallerList.js`

One integration list (JetBrains plugin, VS Code extension or Windhawk mods): a row per target with Install / Remove, install-everywhere and rescan. Only the newest version of each product is listed (rows with `latest: false`, the older JetBrains config folders, sit behind a "Show N older versions" link that toggles them in place). A config with `autoInstall: true` (JetBrains) wires the `<prefix>AutoInstall` switch to `core.settings.<ns>.setAutoInstall`; turning it on installs everywhere at once and the result is reported like an install, and the switch mirrors `status.autoInstall` on every load. A config with `copy.updateInPlace` (Windhawk) adds an Update button to stale rows and uses `copy.staleText`; `copy.installedVerb` switches the outcome wording to "N mods installed into Windhawk". The status may carry `emptyReason` (shown when the list is empty) and `summary` (appended to the help text); a row's `description` becomes its tooltip.

## Methods

- `install()`, `load()`, `run(op, ids)`.
- `JETBRAINS`, `VSCODE`, `WINDHAWK`, `outcome(op, r, copy)`, `stateText(ide, sourceVersion, copy)`,
  `split(ides)` -> `{ newest, older }`, `olderLabel(count, shown)` (static).

## Globals

Reads `window.ipcBridge.invoke('core.settings.<ns>.*')`.
