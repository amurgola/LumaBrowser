# GambitRunner

`core/llm-server/gambit/GambitRunner.js`

Drives the model compatibility gambit: runs every suite task against one live
model and returns the [GambitReport](GambitReport.md). The fit test answers
"does this model fit and how fast is it"; this answers "can it actually do
the job".

## Methods

- `GambitRunner.runGambit(options)` = `new GambitRunner(options).run()`.
- `new GambitRunner({ runTurn, tasks?, capabilities?, onProgress?, isAborted?, meta?, detectCapabilities? })`
  throws `runGambit: runTurn function is required` without `runTurn`.
  - `runTurn({ task, turnIndex, prompt, priorMessages, timeoutMs })` resolves
    one transcript (see [Scorer](../eval/Scorer.md)). The live one is
    [GambitBridgeTurn](GambitBridgeTurn.md)`.create(...)`.
  - `tasks` default to `loadSuite()`; `capabilities` (`{ caps, reasons }` or a
    bare caps object) default to `detectCapabilities()`, which is
    [GambitCapabilities](GambitCapabilities.md)`.detect`.
  - `meta` is echoed into the report with `webTarget` added.
- `run()` resolves the report plus `aborted` and `raw`
  (`[{ taskId, group, prompts, transcripts, scored }]`). Per task:
  1. a task whose `requires` names a missing capability is skipped with the
     first missing capability's reason (else `<caps> unavailable`);
  2. its turns play as one [GambitConversation](GambitConversation.md);
  3. `task.execute` runs [ExecutionCheck](ExecutionCheck.md) and the result
     rides on the last transcript as `execution`;
  4. `Scorer.scoreTask` grades it.
- Progress `onProgress(payload)` with `{ phase, done, total, taskId, group }`
  plus: `skip { reason }`, `task { turns }`, `turn { turn, of }`,
  `result { score, passed }`. A throwing listener is ignored.
- `isAborted()` is checked before each task and each turn; an abort drops the
  half-played task and sets `report.aborted`.
- `GambitRunner.loadSuite(dir = SUITE_DIR)` loads tasks through
  [GoldenSet](../eval/GoldenSet.md).
- `SUITE_DIR` (`core/llm-server/gambit/suite`, seven JSON files, one per
  capability group), `TURN_TIMEOUT_MS` (5 minutes, so a stuck turn cannot
  hold the sweep hostage), `WEB_TARGET`.

## Why

The shape mirrors the fit test on purpose: a long, cancellable, single-flight
run that streams progress and ends in a durable result. The model-driving step
is injected so the whole sweep is testable with a fake.

The gambit exists because on 2026-08-19 a sampler change left Qwen3.8 with no
repetition guard on agent turns, and only a user reading a transcript caught
it.
