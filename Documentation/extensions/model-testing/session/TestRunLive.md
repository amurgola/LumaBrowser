# TestRunLive

`extensions/model-testing/session/TestRunLive.js`

The live snapshot of an in-flight test run, read by the Setup tab and the `run-gambit`
command through the `status` action.

## Shape

`{ running: true, modelPath, suiteIds, startedAt, server, suiteId, total, done, taskId, group, turn, capabilities, outcomes }`

- `server`: `'starting'`, `'started'` or `'failed'` while the chat server is brought up on
  the model; null when it was already up.
- `suiteId`, `total`, `done`, `taskId`, `group`, `turn`, `capabilities`: the suite being
  played; reset by `beginSuite(suiteId)`.
- `outcomes`: one entry per finished task across the whole run,
  `{ suiteId, taskId, group, score, passed }` or `{ suiteId, taskId, group, skipped: <reason> }`.

## Methods

- `new TestRunLive({ modelPath, suiteIds, startedAt })`.
- `noteServer(state)`, `beginSuite(suiteId)`.
- `apply(progress)` mirrors one suite progress event (`resolved`, `task`, `turn`,
  `result`, `skip`).

## Why

A Setup tab's bridge has no event channel, so the run is followed by polling. A tab
reloaded mid-run rebinds to the snapshot instead of showing an idle button that then
refuses with "already running", and the one ordered `outcomes` list lets the CLI print
each task line exactly once with a cursor.
