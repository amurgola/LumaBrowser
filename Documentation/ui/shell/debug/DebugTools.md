# DebugTools

`ui/shell/debug/DebugTools.js`

Ctrl+Shift+Y dumps the native view stack and Ctrl+Shift+U traces the UI thread for 15 s; results go to the console and the notification log.

## Methods

- `dumpViewStack()`, `startRuntimeTrace()`.
- `DebugTools.dumpLines(d)`.

## Globals

Reads `window.viewDebugAPI`.
