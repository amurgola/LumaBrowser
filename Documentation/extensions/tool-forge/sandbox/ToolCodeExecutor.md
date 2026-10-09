# ToolCodeExecutor

`extensions/tool-forge/sandbox/ToolCodeExecutor.js`

The tested authority for compiling and running tool code: a function of ONLY
`(args, ctx)` with no closure over require, module or anything else.

## Methods

- `ToolCodeExecutor.execute({ code, args, ctx, FunctionCtor = Function })`:
  `new FunctionCtor('args', 'ctx', PREAMBLE + code + EPILOGUE)`, awaited with
  `(args || {}, ctx || {})`. Resolves `{ ok: true, result }` (JSON round-tripped,
  `undefined` -> `null`) or `{ ok: false, error }` with `Tool code failed to
  compile: ...`, `Tool threw: ...`, `Your tool code must declare an async
  function named run(args, ctx).` (via `Tool threw:`), or `Tool returned a
  value that cannot be serialized ...`. Never rejects.
- `PREAMBLE` (`"use strict";\n`), `EPILOGUE` (the run() check and call).

## Why

The renderer ([SandboxRunner](../ui/sandbox/SandboxRunner.md), started by `sandbox/runner.js`) runs the same wrapper in a fresh
iframe realm per call and cannot require this file; this class is what jest
tests, so the two wrapper strings must stay identical.
