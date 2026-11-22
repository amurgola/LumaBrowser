# LlmDefaultsUpdater

`core/llm-server/ipc/LlmDefaultsUpdater.js`

Saves the LLM launch defaults, keeps the stored runtime id equal to the runtime that serves the
default model, and stops a running server the change made stale.

## Methods

- `new LlmDefaultsUpdater(llmServerService, log = console)`.
- `update(payload)` resolves `{ defaults, serverStopped }`. A key counts as changed
  when present in the payload and different after the save.
  - A `runtimeId` in the payload (wizards, import flows, the fit test's "Use") means
    "make this the active build of its framework": `runtimeChooser.activate(runtimeId)`
    runs before the save.
  - After a save carrying `modelPath` or `runtimeId`, `await runtimeFollower.follow()`
    ([DefaultRuntimeFollower](../service/DefaultRuntimeFollower.md)) stores the runtime
    that serves the default model and the defaults are read again; a failing follow is
    logged and the save stands as saved.
  - A change to any of `LAUNCH_SHAPE_KEYS` (`modelPath`, `runtimeId`,
    `maxConcurrent`, `tensorSplit`, `cacheReuse`, `usePeerGpus`, `contextSize`,
    `kvCacheType`, `openvinoDevice`), to `launchFlags` (compared as strings), or to the
    stored runtime id however it moved (a new model can move it) stops a non-idle
    server; `serverStopped` is true only when the stop succeeded (a failure is logged).
  - `ramPin.apply()` runs when `pinModelRam` changed, or `modelPath` changed while
    pinning is on; it never stops the server.
  - `groupRouter.apply()` runs when `groupRouter` or `groupRouterPinRam` changed.
- `LAUNCH_SHAPE_KEYS`, `ROUTER_KEYS`.

## Why

A running llama-server is bound to the argv it started with (`-m`, `--parallel`,
`--split-mode`, `--cache-reuse`, `--rpc`, `-c`, `--cache-type-k`, extra flags)
and the environment it started with (`GGML_OPENVINO_DEVICE`),
so a save must never leave a silently stale server; the renderer reports the
stop. The RAM pin lives in its own worker, so it is reconciled instead.

## Changes (2026-11-09, helper model)

`_reconcileHelper`: a `helperModel` patch that changed the stored block (compared as JSON) calls `helperModel.apply()`; the main server is never stopped for it.
