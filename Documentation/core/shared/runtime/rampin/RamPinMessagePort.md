# RamPinMessagePort

`core/shared/runtime/rampin/RamPinMessagePort.js`

The RAM pin worker's link to its parent process.

## Methods

- `RamPinMessagePort.fromProcess(proc)` returns a port over
  `proc.parentPort` (Electron utilityProcess; incoming `event.data` is
  unwrapped), else over `proc.send` / `'message'` (plain `child_process.fork`,
  used by tests), else `null`.
- `on(callback)` subscribes to incoming messages.
- `post(message)` sends to the parent and swallows send failures, because a
  parent that has gone away must not crash a pin in progress.
