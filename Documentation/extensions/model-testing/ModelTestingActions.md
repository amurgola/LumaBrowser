# ModelTestingActions

`extensions/model-testing/ModelTestingActions.js`

Routes the "Model testing" Setup tab's `setup.invoke` actions. The `run-gambit` command
calls the same ones.

## Actions

`handle(action, payload)`; an unknown action throws `Unknown action: <action>`.

- `state` resolves everything the tab draws:
  `{ models, suites, results, run, raw, fitTestRunning }`: the [TestModels](TestModels.md)
  list, the catalog's `describe()` and `results()` (`{ [suiteId]: { [modelPath]: { report, ranAt, canceled } } }`),
  the session's `status()` and `rawIndex()`, and the LLM service's `fitTestRunning` flag.
- `run { modelPath, suiteIds, options }` runs the suites and resolves when the run ends
  (see [TestSession](session/TestSession.md)`.run`).
- `cancel`, `status` are the session's.
- `raw { suiteId }` the last run's full report for one suite.

## Why

One table for the tab and the CLI keeps them two front doors on one run. Progress is
polled (`status`) because a Setup tab's bridge has no event channel.
