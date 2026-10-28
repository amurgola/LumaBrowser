# DesktopRunControl

`core/desktop/service/DesktopRunControl.js`

The user's hand on a desktop run: Pause holds the next real action until
Continue, Stop refuses every action for a moment and releases a hold.
[DesktopService](../DesktopService.md) checks it before each action
(`control.hold`) and [GuardedInput](GuardedInput.md) before each SendInput
batch (`control.check`); the desktop-integration
[agent-run feature](../../../extensions/desktop-integration/features/agent-run/index.md)
drives it from the Ctrl+Alt+Shift keys and the activity island, and listens to
it to show "Paused". Nothing here knows about chat runs: stopping the model's
turn is the caller's job (the feature also calls the chat router's `abort`).

## Methods

- `new DesktopRunControl({ now? })`.
- `paused`, `stopped` (true for `STOP_GRACE_MS`, 3 s, after `stop()`),
  `waiting` (`[{ action, hwnd, title, args }]` of the actions held right now).
- `pause()` / `resume()` -> whether the state changed.
- `stop()` refuses actions for the grace window, fails a held action now and
  clears a pause. `clear()` ends a stop early.
- `async hold(info)` before a real action: `stoppedResult()` when stopped, else
  waits out a pause (emitting `waiting`), resolving null to go on or the stopped
  result when Stop came meanwhile.
- `check()` between SendInput batches: throws a
  [DesktopError](../DesktopError.md) `STOPPED` once stopped.
- `subscribe(listener)` -> unsubscribe; `listener(event, detail)` for `pause`,
  `resume`, `stop` (`{ wasPaused }`) and `waiting` (`{ info }`). A throwing
  listener is ignored.
- `static stoppedResult()` the `{ success: false, error, code: 'STOPPED' }`
  every refused action returns; `STOPPED_MESSAGE` tells the model not to retry.

## Why

The number one request for computer-use agents is a way to pause, take over and
resume, and the number one trust complaint is a cursor moving with no way to
stop it. A stop that only aborts the chat turn leaves the tool call in flight
typing on; this one fails it at the next batch. The grace window instead of a
latch means the next user turn starts clean with nothing to reset.
