# AppDiscovery

`cli/lib/connect/AppDiscovery.js`

Finds the running LumaBrowser, or starts it hidden and waits for it.

## Methods

- `new AppDiscovery({ readHandshake?, healthy?, launch?, sleep?, handshakePath?, startWaitMs?, pollMs? })`:
  every option is a test seam; production uses [HandshakeFile](HandshakeFile.md),
  [AppHealth](AppHealth.md) and [AppProcess](AppProcess.md) (`--hidden`).
- `discover({ autoStart = true, log?, resolveExecutable? })` resolves `{ port, token, started }`:
  - a handshake whose port answers health is returned (`started: false`);
  - otherwise, with `autoStart` and an executable from `resolveExecutable()` (default
    [AppExecutable](AppExecutable.md)`.resolve`), logs `LumaBrowser is not running; starting it…`,
    launches it and polls every `POLL_MS` (1 s) for a handshake with a new token that answers health,
    for up to `START_WAIT_MS` (60 s); then rejects `LumaBrowser did not come up within 60 seconds.`;
  - else rejects `notRunningError()`.
- `notRunningError()`: the `NOT_RUNNING` error naming the handshake path and `npx lumabrowser start`.

## Why

`resolveExecutable` is replaceable because a host that is itself an Electron app (the VS Code
extension) cannot use `process.execPath`: it is the editor, not LumaBrowser.
