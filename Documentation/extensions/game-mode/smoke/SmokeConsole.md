# SmokeConsole

`extensions/game-mode/smoke/SmokeConsole.js`

The backstop console channel: catches page output from before the collector installed. Normalises both Electron `console-message` signatures; keeps 30 errors and 80 lines.

## Methods

- `attach(webContents)`, `record(...args)`, `errors`, `lines`.
