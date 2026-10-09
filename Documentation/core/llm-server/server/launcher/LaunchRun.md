# LaunchRun

`core/llm-server/server/launcher/LaunchRun.js`

Runs one local llama-server start step by step for [ServerLauncher](../ServerLauncher.md).

## Methods

- `new LaunchRun(parts, service, { withVision })`; `parts` is the launcher's set of
  collaborators (`planFor`, `catalog`, `hotswap`, `findFreePort`, `freeMemory`,
  `lending`, `log`, `preflight`, `borrow`, `placement`, `finalizer`, `flagRescue`,
  `oomRescue`).
- `execute()` resolves the launcher's result; the step order is listed in
  [ServerLauncher](../ServerLauncher.md) under Flow.
- `LaunchRun.LENDING_WAIT_MS` (30000).

## Why

A per-start object keeps the shared `ServerLauncher` stateless while the steps
share one [LaunchContext](LaunchContext.md). The hotswap reclaim starts before the
preflight so the sibling's shutdown overlaps it; the log line
`launch preflight: diag Nms, runtimes Nms, scan Nms, plan Nms, evict-join Nms`
makes swap-latency regressions visible.
