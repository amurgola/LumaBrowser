# TextDrip

`core/llm-server/chat/bridge/turn/TextDrip.js`

Paces a buffered answer back in small chunks.

## Methods (all static)

- `play(text, onDelta, shouldAbort)`: `CHUNK_CHARS` (24) every `INTERVAL_MS`
  (18); stops on abort.
