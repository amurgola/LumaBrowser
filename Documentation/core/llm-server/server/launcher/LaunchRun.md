# LaunchRun

`core/llm-server/server/launcher/LaunchRun.js`

Runs one local llama-server start step by step for [ServerLauncher](../ServerLauncher.md).

## Methods

- `new LaunchRun(parts, service, { withVision })`; `parts` is the launcher's set of
  collaborators (`planFor`, `catalog`, `hotswap`, `findFreePort`, `freeMemory`,
  `liveMemory`, `lending`, `log`, `preflight`, `borrow`, `placement`, `finalizer`, `flagRescue`,
  `oomRescue`, `openvinoRescue`).
- `execute()` resolves the launcher's result; the step order is listed in
  [ServerLauncher](../ServerLauncher.md) under Flow. The only up-front refusal is
  `No default model selected.`: a stored runtime id is not needed, because
  [LaunchPreflight](LaunchPreflight.md) resolves the runtime from the model.
- `LaunchRun.LENDING_WAIT_MS` (30000).

## Why

A per-start object keeps the shared `ServerLauncher` stateless while the steps
share one [LaunchContext](LaunchContext.md). The hotswap reclaim starts before the
preflight so the sibling's shutdown overlaps it; the log line
`launch preflight: diag Nms, scan Nms, runtimes Nms, plan Nms, evict-join Nms`
makes swap-latency regressions visible. After that join the cards are read live
(`parts.liveMemory`), so placement and the budget see the cards with any evicted
sibling gone and with what the display and other apps hold; a failed read keeps
the cached snapshot.

## Changes (2026-11-25)

The custom launch (MLX and extension runtimes such as Basalt) now claims the cards its plan reports before the
engine starts (`placement.claimCustomLaunch`). The LLM's release and residency hooks already follow the runtime
server, so the claim ends when the engine stops and is not counted twice once it is ready.
