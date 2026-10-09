# GambitLive

`core/llm-server/ipc/GambitLive.js`

The live snapshot of an in-flight compatibility gambit, read by a reloaded LLM tab.

## Methods

- `new GambitLive(modelPath, startedAt)` fields `running: true, modelPath, startedAt,
  total, done, taskId, group, turn, results: [], skipped: [], report: null`.
- `apply(p)` mirrors a [GambitRunner](../gambit/GambitRunner.md) progress event:
  counters, the current task and group, `turn` (`{ turn, of }` during a `turn`
  phase, else null), `result` rows `{ taskId, group, score, passed }` and `skip`
  rows `{ taskId, reason }`.
