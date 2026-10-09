# BatchScheduler

`core/llm-server/chat/BatchScheduler.js`

Runs a set of tagged sub-tasks with bounded concurrency, scatter-then-gather.

## Methods

- `run(tasks, { concurrency, runTask, signal })` resolves to one result per task
  in input order: `{ id, status: 'done', value }` or `{ id, status: 'error', error }`.
  Tasks are `{ id, kind: 'explore' | 'edit', files? }`. Throws synchronously when
  `runTask` is missing; resolves `[]` for no tasks. Concurrency below 1 or missing
  means 1.

## Why

Explore tasks are read-only and run freely up to the limit. Edit tasks whose
`files` overlap a running edit wait until it finishes, so parallel edits never
compute against each other's stale content. Explore tasks ignore file locks.

The limit is meant to be the server's effective `--parallel` decode-slot count,
so the scheduler never dispatches more in-flight model requests than there are
slots. At 1 it is fully sequential.

One task failing never rejects the batch. An already-aborted `signal` turns
every not-yet-started task into an `'aborted'` error without calling `runTask`.

The scheduler is pure orchestration: the per-task work (an agent sub-run in
code mode's batch tool) is injected as `runTask`.
