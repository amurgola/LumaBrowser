# AcpAgent

`cli/lib/acp/AcpAgent.js`

The Agent Client Protocol method table over a [JsonRpcStdio](JsonRpcStdio.md).

## Methods

- `new AcpAgent({ rpc, connect, defaults?, version?, log? })`: `connect()` resolves
  a connected WsClient to the live app (found or started; a fresh discovery per
  session so a restarted app is found again); `defaults { agent, approval }`.
- `register()`: handles `initialize`, `authenticate` (`{}`), `session/new`,
  `session/load`, `session/prompt`, `session/cancel`, `session/set_config_option`
  and `session/close`; chains.
- `initialize(p)`: records `clientInfo` and `clientCapabilities`; answers
  `protocolVersion: 1`, `agentCapabilities { loadSession: true, promptCapabilities { image, embeddedContext }, mcpCapabilities { http: false, sse: false } }`,
  `agentInfo { name: 'lumabrowser', title: 'LumaBrowser', version }`, no `authMethods`.
- `newSession({ cwd, mcpServers })` -> `{ sessionId, configOptions }`: a new
  [AcpSession](AcpSession.md). The editor's MCP servers are logged and ignored:
  LumaBrowser agents use the app's own tools.
- `loadSession({ sessionId, cwd })` -> `{ configOptions }` after the history replay;
  an unknown id is `INVALID_PARAMS`.
- `prompt({ sessionId, prompt })` -> `{ stopReason }`.
- `cancel({ sessionId })`: a notification; unknown sessions are ignored.
- `setConfigOption({ sessionId, configId, value })` -> `{ configOptions }`.
- `closeSession({ sessionId })` -> `{}`; `closeAll()`.
- `AcpAgent.clientLabel(info)` for the log line.
