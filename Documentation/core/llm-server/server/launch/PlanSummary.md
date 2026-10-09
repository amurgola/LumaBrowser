# PlanSummary

`core/llm-server/server/launch/PlanSummary.js`

The `plan` object a llama.cpp launch returns beside its argv.

## Methods

- `PlanSummary.build(state)` returns the plan with every key listed in
  [LaunchPlanner](../LaunchPlanner.md#plan-keys), grouped as context
  (`contextSize`, `requestedContextSize`, `loadMode`, projector, family), speculation
  (`mtp`, `specType`, `draftCacheType`, KV types), placement (`ngl`, `fullOffload`,
  `partial`, `gguf` summary, `singleGpu`, splits, `flashAttn`, `swaFull`), serving
  (`cacheReuse*`, `promptCache`, slots), experts (`cpuMoe*`, `moeSplit`) and
  accounting (`rpc`, `apiKeyRequired`, byte estimates, `perGpu`,
  `decodeEstimate`, runtime and model names, `port`, `notes`).

## Why

Callers read the plan, not argv: the router compares `requestedContextSize`
(so a 16k pick on an 8k-native model does not restart the server every turn) and
`mmprojPath` / `mmprojAvailable`; the queue gate mirrors `maxConcurrent`; the
placement UI reads `layerSplit`, `moeSplit` and `perGpu`; the fit tester compares
`headerEstimatedBytes` with `measuredVramBytes`. The API key itself is never in the plan.
