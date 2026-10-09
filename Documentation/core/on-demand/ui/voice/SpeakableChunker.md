# SpeakableChunker

`core/on-demand/ui/voice/SpeakableChunker.js`

Cuts a streamed reply into speakable chunks.

## Methods

- `push(text)` -> chunks now complete; `flush()` -> the rest (closes an open
  fence); `reset()`. Chunks are cleaned with [SpeechText](SpeechText.md).

Sentences end at `.!?` (with closing quotes or brackets) plus whitespace, or a
blank line; a chunk needs `MIN_CHUNK_CHARS` 24, shorter ones join the next.
Fenced code is dropped; trailing backticks wait for the next delta so a split
fence marker is still seen.

## Bug fixed

Legacy `drainSpeakable` kept the in-fence flag AND re-prefixed the pending
buffer with the fence marker, so the next delta toggled the fence twice and
read the code aloud (and dropped unspoken text before a fence). The fence state
and the unspoken text are now kept apart. The LLM tab's voice controller has the
same code (see the wave report).
