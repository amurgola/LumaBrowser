# AppLauncher

`core/shell/mcp-stdio/AppLauncher.js`

Starts LumaBrowser for the stdio MCP server when it is not running, and stops it
again only if it started it. Node built-ins only (plus `electron` on the dev
branch).

## Methods

- `new AppLauncher({ shellDir, isRunning, platform?, spawnFn?, wait? })`.
  `shellDir` is the folder holding `McpServer.js` (its `__dirname`);
  `isRunning()` resolves whether the app's API answers.
- `resolveCommand()` returns `{ command, args }`. Installed builds (`shellDir`
  under `app.asar.unpacked`): `LumaBrowser.exe` beside `resources` on Windows,
  `Contents/MacOS/LumaBrowser` on macOS, `lumabrowser` or `LumaBrowser` beside
  `resources` on Linux. Dev: the `electron` binary with the repo root.
- `start()` spawns with stdio ignored and Electron logging off, then polls
  `isRunning` once a second, up to 30 times, rejecting after that.
- `stop()` kills the process only when this launcher started it and it is alive.
- Fields `process`, `autoStarted`; an `exit` or `error` from the child clears them.

## Why

`shellDir` is passed in, rather than read from this file's own location, so the
binary is still found relative to `core/shell` now that the launcher lives one
folder deeper.
