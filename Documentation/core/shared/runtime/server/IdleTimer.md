# IdleTimer

`core/shared/runtime/server/IdleTimer.js`

The idle-unload countdown shared by the managed runtime supervisors
(`BaseRuntimeServer` and `TtsServerService`).

## Methods

- `new IdleTimer(onExpire)` throws if `onExpire` is not a function, so a
  misconfigured timer fails loudly instead of never firing.
- `set(ms)` sets the idle window. `0`, negative, `NaN`, nullish or
  non-numeric values disable it. If a countdown is running it is restarted
  with the new window, so a settings change applies immediately.
- `arm()` (re)starts the countdown. A no-op while the window is disabled.
- `disarm()` stops the countdown. Safe when not armed.
- `ms` (getter) is the configured window, `0` when disabled.
- `armed` (getter) is true while a countdown is pending.

## Why

The handle is `unref`-ed. A referenced pending timer keeps the Electron main
process alive, and app shutdown would block until a 15-minute idle window ran
out. Both legacy copies had to remember this; the class remembers it once.

The handle is cleared before `onExpire` runs, so a callback that re-arms (or
reads `armed`) sees an accurate state rather than a handle about to be nulled.

Composed, not inherited. `BaseRuntimeServer` supervises an HTTP child with a
port, a health endpoint and a CUDA device; `TtsServerService` runs a
utilityProcess worker with none of those, so it cannot extend the base, yet it
has the same idle problem.

The class owns only the timer. When arming is appropriate is the caller's
policy: TTS refuses to arm while requests are in flight.
