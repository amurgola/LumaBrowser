# IdeInstallerList

`ui/shell/settings/general/IdeInstallerList.js`

One integration list (JetBrains plugin, VS Code extension or Windhawk mods): a row per target with Install / Remove, install-everywhere and rescan. Only the newest version of each product is listed (rows with `latest: false`, the older JetBrains config folders, sit behind a "Show N older versions" link that toggles them in place). A config with `autoInstall: true` (JetBrains) wires the `<prefix>AutoInstall` switch to `core.settings.<ns>.setAutoInstall`; turning it on installs everywhere at once and the result is reported like an install, and the switch mirrors `status.autoInstall` on every load. A config with `copy.updateInPlace` (Windhawk) adds an Update button to stale rows and uses `copy.staleText`; `copy.installedVerb` switches the outcome wording to "N mods installed into Windhawk". The status may carry `emptyReason` (shown when the list is empty) and `summary` (appended to the help text); a row's `description` becomes its tooltip.

Each list sits in a fold group ([FoldGroups](FoldGroups.md) keys `jetbrains`, `vscode`, `windhawk`, named by `config.fold`) and reports to its summary line through `summary(s, copy)`: everything installed folds to "Installed in 7 IDEs" (or "6 mods installed"); a Windhawk update opens the group and offers Update on the summary line; nothing installed offers Install there (install everywhere); a JetBrains plugin that is behind reads "updates on next start" without asking for attention. Rows are state-driven: an installed row reads "Installed (v2.1.2)" in muted text (the restart hint is its tooltip) with a quiet Remove, a stale row takes the warning color, and only a row with something to do gets a full button.

## Methods

- `install()`, `load()`, `run(op, ids)`.
- `JETBRAINS`, `VSCODE`, `WINDHAWK`, `outcome(op, r, copy)`, `stateText(ide, sourceVersion, copy)`,
  `summary(s, copy)` -> `{ text, attention, action }`,
  `split(ides)` -> `{ newest, older }`, `olderLabel(count, shown)` (static).

## Globals

Reads `window.ipcBridge.invoke('core.settings.<ns>.*')`.
