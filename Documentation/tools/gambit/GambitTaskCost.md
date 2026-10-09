# GambitTaskCost

`tools/gambit/GambitTaskCost.js`

Per-task cost read from the raw transcripts of a `run-gambit --out` file.

## Methods

- `GambitTaskCost.byTask(report)`: a Map of task id (`id` or `taskId`) to
  `{ ms, iterations, toolCalls, tokPerSec, slowestTurn, score, group }`. Tasks come from `report.raw.tasks`, else
  `report.raw` (array or id map). Every nested object with `durationMs` adds to `ms` and counts as a turn for
  `slowestTurn`; `iterations` and `toolCalls.length` sum; `tokPerSec` comes from `turnTimings` (else `timings`)
  `predicted_n` / `predicted_ms`, null without them; `group` falls back to `category`, then `?`.
- `GambitTaskCost.totals(map)`: `{ ms, iterations, toolCalls }`.
- `GambitTaskCost.walk(node, fn)`: visits each object once.

## Why

Per-turn durations are kept unsummed: a task with 300 s single-iteration turns (a generation hitting a timeout) and
one with 15 s five-iteration turns (a healthy loop) average to the same ms per iteration.
