# DeltaCoalescer

`core/llm-server/chat/router/DeltaCoalescer.js`

Gathers a turn's text deltas for one frame before they cross the IPC boundary.

## Methods

- `new DeltaCoalescer(emit, { flushMs = FLUSH_MS, setTimer, clearTimer })`;
  `emit(type, text)` receives each flushed run. The timer seams are for tests.
- `add(type, text)`: appends to the run for `type` (`delta`, `reasoning-delta`),
  keeping the order the types first appeared in since the last flush, and arms
  the frame timer (unref'd) if none is running. Empty text is ignored.
- `flush()`: cancels the timer and emits every pending run now, in order.
- `pendingChars`.
- `FLUSH_MS` (16): one display frame at 60 Hz.

## Why

[TurnStream](TurnStream.md) used to call `send('delta', { text })` per token:
one structured clone and one renderer wake-up each. The renderer already
repaints on a 55 ms throttle, so nothing visible changes when tokens arrive
together; what changes is the main process's cost at 100 tokens/s and on a
sharing host with several clients. The rule that any other event flushes first
is what Vercel's `smoothStream` does for its typed parts: ordering on the wire
stays the ordering of events.
