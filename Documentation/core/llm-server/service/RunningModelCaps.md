# RunningModelCaps

`core/llm-server/service/RunningModelCaps.js`

What a local model can do, running or not: what an earlier load learned
([ModelCapsCache](../server/ModelCapsCache.md)) first, the live probe second.

## Methods

- `new RunningModelCaps({ runtimeServer, capsCache, getDefaultModelPath })`.
- `runningModelPath(status)` `status.modelPath`; while `ready` or `starting`
  without one, the default model; else null.
- `get(modelPath?)` (omitted means the default model) returns
  `{ reasoningEffort, reasoningDial, thinking, source }` with `source: 'cache'`
  when the cache knows the model, else `'live'` when the running model matches
  (`ModelCapsCache.modelKeyOf`) and its probe has a boolean `reasoningEffort`;
  else null. `reasoningDial` is `ReasoningEffort.dialPositionsFor(thinking)`.
- `runningThinking()` the ready server's `caps.thinking`, else null (also on a throw).
- `rememberRunning()` stores the running load's caps under its model (called on `ready`).

## Why

The chat starts its model on the first message, so a dial that waited for the
live probe would be missing exactly when the user wants to set it. A launch
built outside the core planner may not name its file, and the launcher only ever
starts the default model, so that is the honest fallback while serving.
