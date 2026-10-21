# TextDrip

`core/llm-server/chat/bridge/turn/TextDrip.js`

Paces a buffered answer back in small chunks, at the model's own speed.

## Methods (all static)

- `play(text, onDelta, shouldAbort, pace?)`: one chunk every `INTERVAL_MS`
  (18); stops on abort. `pace.charsPerSecond` (the run's observed decode speed,
  [RunHealth](RunHealth.md)`.charsPerSecond()`) sets the chunk.
- `chunkFor(charsPerSecond)`: characters per tick: the speed floored at
  `MIN_CHARS_PER_SECOND` (600), or `DEFAULT_CHARS_PER_SECOND` (1333, the old
  fixed 24 characters a tick) when the speed is unknown (remote providers send
  no timings).

## Why

A replay used to run at one fixed pace whatever the model had been doing, so
it read as a paste after a stream. Matching the decode speed makes the replay
indistinguishable from the model still talking; the floor keeps a slow model's
long answer from taking a minute to re-type, because a replay is a catch-up.
