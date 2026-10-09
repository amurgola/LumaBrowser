# GambitSession

`core/llm-server/ipc/GambitSession.js`

Runs the model compatibility gambit from the LLM tab or the CLI, one at a time.

## Methods

- `new GambitSession({ llmServerService, chatRouter, fitTests, target?, runner?, capabilities?, bridgeTurn?, now?, log? })`
  (defaults a [GambitTarget](GambitTarget.md), `GambitRunner`, `GambitCapabilities`, `GambitBridgeTurn`).
- `run(args, send)` with `{ modelPath, filter: { groups, taskIds }, nativeHistory, nativeTools, agentEffort, parallel, promptExperiments }`:
  1. refuses `A compatibility gambit is already running.` and, while
     `fitTests.running`, `A fit test is running. Wait for it to finish.`;
  2. resolves the target (its error is returned);
  3. detects capabilities, loads and filters the suite (`No tasks matched that filter.`),
     sends `resolved { modelPath, total, capabilities, capabilityReasons, filtered }`;
  4. runs `GambitRunner.runGambit` with a `GambitBridgeTurn` over `router.agentBridge`,
     the [GambitProvenance](GambitProvenance.md) meta and `isAborted`, streaming `progress`;
  5. records context drift, keeps `{ modelPath, ranAt, report }` in memory for `raw()`,
     saves the grade when persistable, sends `done` or `canceled { report, ranAt }`
     with the report minus `raw`.
  Resolves `{ success: true, canceled, report, ranAt }` (`ranAt` null when not saved);
  a throw sends `error { message }` and resolves `{ success: false, error }`.
- `cancel()`, `status()` as in [FitTestSession](FitTestSession.md) (with [GambitLive](GambitLive.md)).
- `raw()` `{ success: true, raw }`, or `No raw results in memory. Raw transcripts are kept only for the most recent run in this session.`
- `GambitSession.options(args)` the defaulted options; `GambitSession.filterSuite(suite, filter)`
  the tasks in the named groups or ids (unchanged when both lists are empty), null when none match.

## Why

Shaped like the fit test (single flight, streamed events, live snapshot, durable
results) because it has the same problem. Raw transcripts are megabytes per run,
so only the latest stays in memory and settings never stores them.
