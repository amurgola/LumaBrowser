# TestSession

`extensions/model-testing/session/TestSession.js`

Runs the selected test suites against one downloaded model, one run at a time.

## Methods

- `new TestSession({ llmServerService, chatRouter, catalog, target?, now?, log? })`
  (defaults a [TestTarget](TestTarget.md)); `catalog` is the [TestSuiteCatalog](../TestSuiteCatalog.md).
- `run({ modelPath, suiteIds, options })`:
  1. refuses `A model test is already running.` and, while the LLM service's
     `fitTestRunning` flag is set, `A fit test is running. Wait for it to finish.`;
  2. refuses `Pick at least one test to run.` when no id names a known suite;
  3. opens the [TestRunLive](TestRunLive.md) snapshot, then resolves the target (its error
     is returned), which loads the model;
  4. plays each suite in display order, passing `options` through (the CLI's task filter
     and experiment switches), stopping before the next suite once cancel was asked;
  5. after each suite keeps its full report in memory for `raw()` and asks the suite to
     save its grade;
  6. always restores the default model the target replaced, then closes the snapshot.
  Resolves `{ success: true, canceled, modelPath, runs: [{ suiteId, report, canceled, ranAt }], outcomes }`
  (reports without `raw`; `ranAt` null when the suite did not keep the run; `outcomes`
  the snapshot's per-task list), or `{ success: false, error }` (a throwing suite included).
- `cancel()` `{ running }`; `status()` `{ running, live }`.
- `raw(suiteId)` `{ success: true, raw: { modelPath, ranAt, suiteId, report } }`, or
  `No raw results in memory. Raw transcripts are kept only for the most recent run in this session.`
- `rawIndex()` `{ modelPath, suiteIds }` that `raw()` can still answer for, or null.

## Why

Shaped like the fit test (single flight, live snapshot, durable results) because it has
the same problem: a long run through finite VRAM. Raw transcripts are megabytes per run,
so only the latest stays in memory and settings never stores them. The snapshot opens
before the model loads so a tab polling during a long load sees the run.
