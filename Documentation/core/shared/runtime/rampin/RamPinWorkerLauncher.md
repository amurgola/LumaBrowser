# RamPinWorkerLauncher

`core/shared/runtime/rampin/RamPinWorkerLauncher.js`

Starts the [RamPinWorker](RamPinWorker.md) process for
[RamPinService](RamPinService.md).

## Methods

- `RamPinWorkerLauncher.fork(workerPath, serviceName)` returns the worker.
  Inside the Electron main process it is an Electron `utilityProcess` (piped
  stdio, the parent's environment). Anywhere else (jest under
  electron-as-node, e2e harnesses that build services directly) it is a
  `child_process.fork` with stdout and stderr piped and a `postMessage(message)`
  shim over `send` that ignores a closed channel. The worker speaks both
  transports.
- `RamPinWorkerLauncher.WORKER_PATH`: absolute path of `RamPinWorker.js`.

## Why

The worker is loaded by path and must never be required: loading it starts it.
Its name must keep ending in `worker.js` so the bytecode build ships it as
plain JS (see RamPinWorker).
