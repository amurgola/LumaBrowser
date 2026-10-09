# FileMutationQueue

`core/shell/FileMutationQueue.js`

Serializes async mutations that target the same file while letting different files run in parallel.

## Methods

- `new FileMutationQueue()`
- `queue.run(key, fn)` runs `fn` once every earlier mutation queued under `key` has settled, and resolves or rejects
  with `fn`'s own result. `key` should be a stable per-file identity (resolved path).
- `queue.isBusy(key)` is true while any mutation is queued for `key`.

## Why

The coding agent's batch and fan-out edits (several sub-agents, or several tool calls at once) rely on this so
colliding edits queue behind each other instead of clobbering. A failed mutation does not wedge its key: the next one
runs whether the previous fulfilled or rejected. A key is dropped once its last queued op settles, so the map cannot
grow without bound.
