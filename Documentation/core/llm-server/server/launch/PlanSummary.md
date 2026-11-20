# PlanSummary

`core/llm-server/server/launch/PlanSummary.js`

The `plan` object a llama.cpp launch returns beside its argv.

## Methods

- `PlanSummary.build(state)` returns the plan with every key listed in
  [LaunchPlanner](../LaunchPlanner.md#plan-keys), grouped as context
  (`contextSize`, `requestedContextSize`, `loadMode`, `ramPinSlowsDecode`, projector, family), speculation
  (`mtp`, `specType`, `draftCacheType`, KV types), placement (`ngl`, `fullOffload`,
  `softHeadroom`, `partial`, `gguf` summary, `singleGpu`, splits, `flashAttn`, `swaFull`), serving
  (`cacheReuse*`, `promptCache`, slots), experts (`cpuMoe*`, `moeSplit`, `moeGpuCacheMib`, `moeGpuCacheOffReason`, `moeCacheSingleCardBytes`,
  `moeRamMib`, `moeRamOffReason`, `moeRamRegisterMib`, `moeProfilePath` from [MoeRamTierPlan](MoeRamTierPlan.md)) and
  accounting (`rpc`, `spawnEnv`, `apiKeyRequired`, byte estimates including
  `vramAvailableBytes` and `fullOffloadRoomBytes`, `perGpu`, `decodeEstimate`,
  runtime and model names, `port`, `notes`).
  - `softHeadroom`: the whole model sits on one card inside the soft half of the GPU
    headroom ([OffloadDecision](OffloadDecision.md)).
  - `layerSplit`: `{ ratio, perDevice, order }` from [LayerFillSplit](LayerFillSplit.md), or
    null. `perDevice` is per card in perGpu order; `ratio` and `order` (slowest first, or
    null) are in llama.cpp's device order.
  - `spawnEnv`: the loading stage's environment, with `CUDA_DEVICE_ORDER=PCI_BUS_ID`
    added when the fill names a device order (the loading stage's own values win).

## Why

Callers read the plan, not argv: the router compares `requestedContextSize`
(so a 16k pick on an 8k-native model does not restart the server every turn) and
`mmprojPath` / `mmprojAvailable`; the queue gate mirrors `maxConcurrent`; the
placement UI reads `layerSplit`, `moeSplit` and `perGpu`; the fit tester compares
`headerEstimatedBytes` with `measuredVramBytes`. The API key itself is never in the plan.
The VRAM watchdog reads `softHeadroom` to band that card against the soft reserve, so a
load that chose the tighter margin does not trip its own warning. A named device order
counts cards the way nvidia-smi does, so the child must enumerate them by PCI bus even
without a pin (CUDA's own default is fastest first).

## Drafter choice

The speculation part also carries `drafterChoiceKey` (from [ModelFiles](ModelFiles.md);
the chat router restarts the server when the saved choice differs) and `specDraftNMax`
(the drafter's tokens per step, null without a drafter).
