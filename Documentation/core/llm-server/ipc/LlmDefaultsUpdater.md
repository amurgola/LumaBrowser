# LlmDefaultsUpdater

`core/llm-server/ipc/LlmDefaultsUpdater.js`

Saves the LLM launch defaults and stops a running server the change made stale.

## Methods

- `new LlmDefaultsUpdater(llmServerService, log = console)`.
- `update(payload)` resolves `{ defaults, serverStopped }`. A key counts as changed
  when present in the payload and different after the save.
  - A change to any of `LAUNCH_SHAPE_KEYS` (`modelPath`, `runtimeId`,
    `maxConcurrent`, `tensorSplit`, `cacheReuse`, `usePeerGpus`, `contextSize`,
    `kvCacheType`) or to `launchFlags` (compared as strings) stops a non-idle
    server; `serverStopped` is true only when the stop succeeded (a failure is logged).
  - `ramPin.apply()` runs when `pinModelRam` changed, or `modelPath` changed while
    pinning is on; it never stops the server.
  - `groupRouter.apply()` runs when `groupRouter` or `groupRouterPinRam` changed.
- `LAUNCH_SHAPE_KEYS`, `ROUTER_KEYS`.

## Why

A running llama-server is bound to the argv it started with (`-m`, `--parallel`,
`--split-mode`, `--cache-reuse`, `--rpc`, `-c`, `--cache-type-k`, extra flags),
so a save must never leave a silently stale server; the renderer reports the
stop. The RAM pin lives in its own worker, so it is reconciled instead.
