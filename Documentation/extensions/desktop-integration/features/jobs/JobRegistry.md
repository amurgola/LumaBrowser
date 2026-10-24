# JobRegistry

`extensions/desktop-integration/features/jobs/JobRegistry.js`

The jobs feature's one list of long-running work. Sources report into it; the
REST routes, the SSE stream, the taskbar surface and `summary()` read it.
Job shape: see the [feature page](index.md#the-job-object).

## Methods

- `newId(prefix)` -> `'<prefix>-<base36 time>-<n>'`, unique for this app run.
- `start(id, { kind, title, progress?, state?, eta?, detail?, source? }, cancel?)`:
  creates (or restarts) a running job; `cancellable` is true only when a
  `cancel` function is given. Progress is clamped to 0..1 (anything else is null).
- `update(id, patch)`: title, detail, progress, eta (`null` removes it), state
  (`running`/`queued`). Ignored for unknown or finished jobs.
- `finish(id, 'done'|'failed'|'canceled', { error?, detail? })`: sets
  `finishedAt`, drops the cancel path, sets progress to 1 on `done` when it was
  known; the job moves to the recent list.
- `get(id)`, `isActive(id)`.
- `list()` -> `{ active, recent }` (copies). Recent keeps at most 20 jobs and
  only for 30 minutes, newest first (ties broken by finish order).
- `cancel(id)` -> `{ success, status, job? | error }`: 404 unknown, 409 finished
  or no cancel path, 500 when the cancel path throws. The source finishes the
  job itself when the work actually stops.
- `aggregate(filter?)` -> `{ running, queued, progress, indeterminate, eta, jobs }`.
- `onChange(fn)` -> unsubscribe. `fn({ type: 'job', job })`. A change of title,
  detail or state is always reported; a progress or eta change at most every
  `PROGRESS_INTERVAL_MS` (250) per job. A throwing listener is ignored.
- `dispose()`: forgets jobs and listeners; cancel paths are not called.

`now` is a constructor seam for tests.
