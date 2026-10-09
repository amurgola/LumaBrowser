# BridgeConnector

`cli/lib/connect/BridgeConnector.js`

Opens the app's terminal bridge.

## Methods (static)

- `BridgeConnector.url(port, token)`: `ws://127.0.0.1:<port>/api/ext/code-mode/terminal?token=<encoded>`.
- `BridgeConnector.open({ port, token })`: resolves a connected [WsClient](WsClient.md) that also
  sends `Authorization: Bearer <token>`; rejects with the client's handshake errors.
- `BridgeConnector.PATH`: `/api/ext/code-mode/terminal` (code-mode's `/terminal` upgrade under the
  gateway's `/api/ext/<id>` prefix).

## Why

[TerminalAuth](../../../extensions/code-mode/terminal/TerminalAuth.md) accepts the token from the
query or a Bearer header; both are sent so either side can change which it prefers.
