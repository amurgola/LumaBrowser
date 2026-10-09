# CliConnectLib

`ide/vscode/src/CliConnectLib.js`

The `luma` CLI's discovery and socket (`cli/lib/connect`, copied into `lib/connect` by the build) in the session's
shape, so the extension reaches the app exactly as the terminal does. Discovery gets the extension's own
executable lookup, because `process.execPath` in an extension host is the editor.

## Methods

- `CliConnectLib.load()`: requires `../lib/connect/AppDiscovery` and `BridgeConnector`; throws when lib/ is missing.
- `discover({ autoStart, resolveExecutable, log })`, `openBridge({ port, token })`.
