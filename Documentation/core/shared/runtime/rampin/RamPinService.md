# RamPinService

`core/shared/runtime/rampin/RamPinService.js`

Supervises one RAM pin worker ([RamPinWorker](RamPinWorker.md)) that keeps a
feature's default model locked in physical RAM for the app's lifetime. One
instance per owner: the LLM server pins the default chat model, the image
server the default generate and edit models.

## Methods

- `new RamPinService({ name, isEnabled, resolveTarget, fork, memory })`.
  - `name`: worker service name and log prefix (default `luma-ram-pin`).
  - `isEnabled()`: reads the owner's persisted toggle.
  - `resolveTarget()`: async, returns `{ key, modelName, totalBytes, files: [{ path, sizeBytes }] }`
    or `{ error }`. `key` identifies the selection (LLM: first weights path;
    image: model id) so a reconcile can tell "same model" from "repin".
  - `fork(workerPath)`: test seam; defaults to `RamPinWorkerLauncher.fork`.
  - `memory`: test seam `{ freeBytes(), totalBytes() }`; defaults to `os`.
- `apply()` reconciles the worker with the setting. Serialized, never rejects
  (a throw becomes `state: 'error'`). Disabled or unsupported: stop. Target
  error: stop, then error state. Same key already pinning or pinned: no-op.
  Otherwise stop the old worker, run [RamPinFitGate](RamPinFitGate.md) against
  free RAM minus every other instance's claimed-but-unlocked bytes, and on a
  pass fork the worker and send `{ type: 'pin', files }`.
- `stop()` sends `unpin`, kills the worker and resets to idle. Fast enough for
  the app's quit watchdog.
- `getStatus()` returns `{ supported, reason, enabled, state, error, totalBytes, lockedBytes, modelName }`;
  `state` is `idle`, `pinning`, `pinned` or `error`.
- `isActiveFor(key)`: the pinned (or still pinning) model has this key.
- `isSupported()`: Windows and Linux only.

Worker messages: `progress` updates locked bytes, `pinned` sets the state and
logs, `error` sets the error state. An exit after an error keeps the error;
any other exit is logged and resets to idle. Messages and exits from a replaced
worker are ignored.

## Why

Locks are per worker process, so unpinning (toggle off, quit, crash) is always
killing the worker: the OS releases every page and nothing can leak
unevictable memory. The OS backs all mappings of a file with the same pages,
so the pinned copy is the copy the inference server reads.

The cross-instance claim exists because with both pins enabled two reconciles
can gate at the same instant on boot, and `os.freemem()` only drops once a
worker has wired its pages. Without it both could pass on RAM that fits one.
