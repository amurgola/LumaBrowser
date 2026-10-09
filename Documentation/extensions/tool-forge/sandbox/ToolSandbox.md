# ToolSandbox

`extensions/tool-forge/sandbox/ToolSandbox.js`

Main-process host of the code sandbox. AI-authored tool code is data and only
runs in the [SandboxWindow](SandboxWindow.md); its only capabilities are the
IPC channels served here.

## Methods

- `new ToolSandbox({ getLiveApi, safeFetch, logger, electron })` (`electron`
  defaults to `require('electron')`). Binds `toolforge:result` (listener) and
  `toolforge:net` (handler) for this instance.
- `exec({ code, args, config, allowedHosts, timeoutMs })`: resolves
  `{ ok, result }` or `{ ok, error }`, never rejects. One call at a time; at
  `MAX_QUEUED` (8) waiting it answers `Sandbox is busy (max 8 tool runs
  queued). Try again shortly.` Each call: timeout clamped by
  [SandboxPolicy](SandboxPolicy.md), window prepared (`Sandbox failed to
  start: ...`), `toolforge:exec` sent `{ callId, code, args, config, timeoutMs }`.
  A result counts only from the runner page's webContents and with the active
  `callId`. At timeout + `GRACE_MS` (2000) the window is destroyed (a hung
  renderer cannot answer IPC) and the call fails `Tool timed out after <n>s.`;
  a renderer crash fails it `Sandbox crashed (<reason>).`
- `toolforge:net` requests from any other sender get `not authorized`; the
  runner's go to [SandboxNetBridge](SandboxNetBridge.md) with the active call.
- `dispose()`: destroys the window, fails queued calls `Sandbox shut down.`
  and unbinds the IPC (the in-flight call ends at its timeout, as in legacy).
- Statics `MAX_QUEUED`, `GRACE_MS`, `EXEC_CHANNEL`, `RESULT_CHANNEL`, `NET_CHANNEL`.
