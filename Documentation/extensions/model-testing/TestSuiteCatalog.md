# TestSuiteCatalog

`extensions/model-testing/TestSuiteCatalog.js`

The test suites a run can select, in display order.

## Methods

- `new TestSuiteCatalog({ llmServerService, chatRouter, suites? })` builds the shipped
  list: one [CompatibilityGambit](gambit/CompatibilityGambit.md). `suites` is a test seam.
- `describe()` `[{ id, label, description, duration, taskCount }]` for the tab.
- `pick(suiteIds)` the suites with those ids in display order; unknown ids are dropped.
- `results()` `{ [suiteId]: { [modelPath]: { report, ranAt, canceled } } }`.

## The suite contract

A suite is an object with:

- `id`: a stable string (it names the suite in run requests, raw downloads and results).
- `describe()`: `{ id, label, description, duration, taskCount }`.
- `run({ target, options, startedAt, isAborted, onProgress })`: plays the suite against
  the resolved [TestTarget](session/TestTarget.md) and resolves a report
  (`{ overall, band, groups, coverage, worstDecile, meta, aborted, raw }`). `onProgress`
  takes `{ phase: 'resolved', total, capabilities }` once, then `task`, `turn`, `result`
  and `skip` events ([TestRunLive](session/TestRunLive.md) mirrors them).
- `results()`: the stored grades by model path.
- `save(modelPath, report, ranAt)`: stores the grade and returns its `ranAt`, or null
  when the run is not one to keep.

## Why

"Which tests to run" is a list the user ticks, so each suite owns everything specific to
it (its tasks, its report, where its grades are stored) and the session stays the same
for all of them.
