# FileWatchSource

`core/llm-server/chat/triggers/FileWatchSource.js`

The file / folder trigger source. Keeps one [FileWatch](file/FileWatch.md) per
file trigger in step with the trigger store and routes each settled file event
to that trigger through the runner.

## Methods

- `new FileWatchSource({ triggerStore, runner, settingsDb?, emitEvent?, forbiddenRoots? })`.
  Throws `FileWatchSource needs triggerStore + runner`. `triggerStore` needs
  `list()`; `runner` needs `deliver(triggerId, event, { dedupeKey, source })`;
  `settingsDb` needs `get/set/delete` and holds the snapshots under
  `core.triggers.fileSnapshot.<triggerId>`; `emitEvent(type, payload)` gets
  `watch-error` and `catch-up` with `triggerId` and `title` added;
  `forbiddenRoots` are the application and data folders.
- `validateDir(dir)`: [WatchFolder](file/WatchFolder.md)`.validate` with the
  forbidden roots; the real path or a throw.
- `reconcile()`: returns `{ watching: [triggerId] }`. A `file` trigger with a
  `source.dir` is watched while it is armed OR still awaiting its sample (the
  first matching event is captured, not run). A watch whose `source` changed is
  re-created; one no longer wanted is stopped. A folder that fails validation is
  recorded as the trigger's error and reported as `watch-error`, not watched.
- `status(triggerId)`: `{ watching, error }`.
- `watchFor(triggerId)`: the live FileWatch or `null`.
- `forget(triggerId)`: on trigger delete; stops the watch and deletes the
  persisted snapshot.
- `stopAll()`.
- `FileWatchSource.KIND` (`'file'`, the `source` passed to `deliver`),
  `SNAPSHOT_KEY_PREFIX`.

## Why it does not extend TriggerSource

[TriggerSource](TriggerSource.md) subscribes once to an upstream emitter that
appears after core wiring and fans each event out to every matching trigger.
File triggers have no shared upstream: each trigger owns its own fs watch on
its own folder, events are routed to exactly one trigger, and the lifecycle is
driven by store changes (`reconcile`), not by an upstream appearing. Forcing it
into the base would leave `_canSubscribe`, `_subscribe` and
`_matchesTrigger` meaningless, so it keeps the same constructor contract and
`KIND` but not the base class.
