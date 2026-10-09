# RunClock

`core/llm-server/agent/RunClock.js`

The wall clock of one agent run.

## Methods

- `new RunClock(timeoutMs, now = Date.now())`: a missing, zero, negative or
  infinite timeout means no wall clock (Code mode runs that way).
- `expired(now)`, `remainingMs(now)` (Infinity without a clock), `elapsedMs(now)`, `timeoutMs`.
- `extend(ms)`: slides the deadline.

## Why

The clock bounds the model's time, not the tools': a 14-minute image render is
work the user asked for, and ending the turn while it runs leaves its result
applied but unreported. [ToolBatchRunner](ToolBatchRunner.md) extends the
deadline by every tool's duration.
