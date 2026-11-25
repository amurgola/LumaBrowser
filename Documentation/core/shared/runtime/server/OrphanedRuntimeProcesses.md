# OrphanedRuntimeProcesses

`core/shared/runtime/server/OrphanedRuntimeProcesses.js`

Finds and ends the processes a runtime left behind when the app that started
them is gone (a crash, a forced kill, an older build): processes from the
runtime's own folder whose parent no longer exists. Such a Basalt server kept the
model in VRAM and its port bound, and the next launch's health check reached it
instead of the new server: the model showed "ready", then "failed to load", and
the old server answered (2026-11-25). A process still owned by a live app (another
LumaBrowser, a test instance) is left alone.

## Methods

- `OrphanedRuntimeProcesses.find(binaryPath, { platform, readProcesses })`:
  `[{ pid, name }]` of the orphaned subtree roots, `[]` off Windows or when the
  process table cannot be read.
- `OrphanedRuntimeProcesses.orphansIn(rows, folder)`: the rule over
  `Win32_Process` rows: the executable lies in the folder or the command line
  names it (Basalt's real Python interpreter lives elsewhere but runs
  `serve.server --engine-bin <folder>\bin\basalt.exe`), and the parent is not
  running. Their own children are reached by the tree kill. Case-insensitive.
- `OrphanedRuntimeProcesses.runtimeFolder(binaryPath)`: the version folder above
  `bin\`, else the binary's own folder.
- `OrphanedRuntimeProcesses.sweep(binaryPath)`: ends what `find` returns through
  [ProcessDescendants](ProcessDescendants.md) `killAll` (name-checked tree kill)
  and resolves the list.

[BaseRuntimeServer](../BaseRuntimeServer.md) sweeps before it starts a
tree-killed launcher.
