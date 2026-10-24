# SenderStream

`core/shared/ipc/SenderStream.js`

Streams progress messages to the renderer that made an IPC call.

## Methods

- `SenderStream.create(event, channel, base = {})` returns
  `emit(type, payload)`, which sends `{ ...base, type, payload: payload || {} }`
  on `channel` to `event.sender`. It is a silent no-op when there is no sender,
  the sender is destroyed, or `send` throws.
- `SenderStream.observe(fn)` registers a main-process observer called as
  `fn(channel, message)` for every message any stream emits (before, and
  regardless of, the renderer send). Returns an unsubscribe function. An
  observer that throws is ignored. Used by the Desktop Integration
  [jobs feature](../../../extensions/desktop-integration/features/jobs/index.md)
  to see download and install progress without each flow knowing about it.

## Why

The sender is captured once but checked on every emit: a long install often
outlives the window that started it, and sending to a destroyed webContents
throws. Progress is advisory, so the operation itself carries on and returns
its result normally.
