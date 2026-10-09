# FileWatch

`core/llm-server/chat/triggers/file/FileWatch.js`

One file trigger's watch on its folder. Created and owned by
[FileWatchSource](../FileWatchSource.md).

## Methods

- `new FileWatch({ dir, glob, events, settleMs, recursive, catchUp = true, onEvent, snapshot, persist, emit })`.
  `dir` must already be validated. `events` is a subset of `FILE_EVENTS`
  (`add`, `change`, `remove`; default `add`, `change`). `settleMs` clamps to
  200 ms .. 60 s (default 1.5 s). `snapshot` is the persisted
  `{ files: { relPath: [mtimeMs, size] }, overflow? }`.
- `start()`: begins `fs.watch` (recursive when asked) and the initial scan;
  returns (and stores as `ready`) a promise that resolves after the scan. A
  watch that cannot start (or later errors) sets `error`, emits `watch-error`
  and stops.
- `stop()`: clears timers and closes the watcher.
- Public state: `dir`, `recursive`, `catchUp`, `events`, `settleMs`,
  `snapshot` (Map), `error`, `ready`.

## Behaviour

- **Settle.** A raw fs event for a matching path only schedules a check. The
  check re-stats the file and fires once size and mtime stopped moving for
  `settleMs`, so a half-written CSV never fires. Each new event restarts the
  timer.
- **Kinds.** add / change / remove are derived from the snapshot. A touch
  without a size or mtime change is silent. Events outside the trigger's list
  still advance the snapshot but do not fire.
- **First start.** With no persisted snapshot the folder is recorded silently:
  arming a trigger on a folder of a thousand files must not fire a thousand runs.
- **Catch-up.** With a persisted snapshot and `catchUp` on, what changed while
  the app was closed is replayed through [CatchUpPlan](CatchUpPlan.md) (oldest
  first, at most 50, `catchUp: true` on each event) and a `catch-up` event
  reports `{ fired, dropped }`.
- **Persistence.** Every snapshot change calls `persist`. A scan that overflowed
  or a snapshot over 5000 files is persisted as `{ overflow: true }`, so the
  next start records silently.
- **Delivery.** `onEvent(event, dedupeKey)` with
  `<kind>|<relPath>|<mtimeMs or gone>|<size>`, so one settled file version never
  runs twice. A throwing consumer never kills the watch.
