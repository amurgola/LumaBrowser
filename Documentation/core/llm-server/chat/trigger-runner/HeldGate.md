# HeldGate

`core/llm-server/chat/trigger-runner/HeldGate.js`

One trigger run's hold on the shared [BackgroundRunGate](../BackgroundRunGate.md).
A run parked on a human approval hands the gate back, then takes it again once
the answer lands and the gate is free.

## Methods

- `new HeldGate(gate, owner)`.
- `acquire()`: true when held (idempotent); false after `close()` or when
  another owner holds the gate.
- `release()`: hands the gate back (no-op when not held).
- `reacquire(stillWanted)`: takes the gate back now, or retries every
  `RETRY_MS` (2 s, unref'd) while `stillWanted()` is true.
- `close()`: the run is over; releases for good so a pending reacquire never
  takes the gate back.
- `held` (getter).
