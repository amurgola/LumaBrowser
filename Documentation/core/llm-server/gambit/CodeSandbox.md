# CodeSandbox

`core/llm-server/gambit/CodeSandbox.js`

Compiles and invokes model-written `run(args, ctx)` JavaScript once in a fresh `vm` context
with a hard timeout.

## Methods

- `CodeSandbox.runOnce({ code, args, ctx, timeoutMs = 5000 })` (async) returns
  `{ ok: true, result }` (result round-tripped through JSON, `undefined` becomes `null`) or
  `{ ok: false, error }`. Errors include "must declare an async function named run",
  `execution timed out after <ms>ms`, a thrown message, and non-serializable results.
  `ctx.__inject.__ambient`, if present, is merged into the sandbox globals.
- `CodeSandbox.CASE_TIMEOUT_MS` is 5000.

The sandbox has no `require`, `process` or `module`; `console` is a silent no-op so debug
logging neither crashes nor pollutes the gambit's progress stream.

## Why vm and two timeouts

Tool forge's sandbox shares the `run(args, ctx)` contract but runs in a disposable renderer,
escaping a runaway by destroying the window. This runs in the main process, jest and the CLI,
where a synchronous `while (true) {}` would wedge the event loop and a promise-race timer
would never fire. `vm`'s `timeout` interrupts synchronous execution; a timer race then covers
the asynchronous tail, where the event loop is free.

The isolation is deliberately scoped: it grades code a local model wrote as a pure function, on
the user's machine, at the user's request. It is not a sandbox for untrusted third-party code
and must not be repurposed as one.
