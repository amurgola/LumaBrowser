# SandboxRunner

`extensions/tool-forge/ui/sandbox/SandboxRunner.js`

Runs AI-written tool code inside the hidden, sandboxed, network-cancelled
runner page ([SandboxWindow](../../sandbox/SandboxWindow.md)).

## Methods

- `new SandboxRunner(forge, doc = document)`: `forge` is `window.__forge`
  from [runner-preload.js](../../sandbox/runner-preload.md), the page's only
  way out.
- `start()`: handles every `onExec` message; a runner crash still replies
  `{ callId, ok: false, error: 'Runner failure: ...' }`.
- `run(msg)` (`{ callId, code, args, config }`): compiles
  `PREAMBLE + code + EPILOGUE` as `(args, ctx)` with the Function
  constructor of a fresh, immediately removed iframe realm (no globals leak
  between calls), runs it with `ctx = { config, fetch(url, options),
  luma: { fetchPage, openTab } }` whose calls go to `forge.net({ callId, op,
  params })`, JSON-clamps the result (`undefined` -> null) and posts
  `{ callId, ok, result | error }`. Errors: "Sandbox realm error: ...",
  "Tool code failed to compile: ...", "Tool threw: ...", `NOT_SERIALIZABLE`.

`PREAMBLE`/`EPILOGUE` must equal [ToolCodeExecutor](../../sandbox/ToolCodeExecutor.md)'s,
the tested authority in the main process; a test pins it.

## Globals

None of its own (the entry passes `window.__forge`).
