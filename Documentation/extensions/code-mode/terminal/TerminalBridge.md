# TerminalBridge

`extensions/code-mode/terminal/TerminalBridge.js`

The terminal bridge: `luma <agent>` and the IDE plugins talk to the running app
over one WebSocket, and a Code-mode project conversation does the work. The
CLI is the fourth consumer of the chat router's event stream.

## Methods

- `new TerminalBridge({ getRouter, getAgentManager, getHandshake, getLlmServer, fsOps, WebSocketServer, runGit })`:
  a `noServer` WebSocket server with `maxPayload` 4 MB (images ride base64);
  `fsOps` defaults to a container-routed fs, `runGit` to [GitLog](GitLog.md)`.run`.
- `available` (getter): whether `ws` loaded.
- `stats()` -> `{ sessions }`.
- `handleUpgrade(req, socket, head)`: [TerminalAuth](TerminalAuth.md) first
  (a refusal writes `401 Unauthorized` and destroys the socket), then one
  [TerminalSession](TerminalSession.md) per socket, disposed on close.
