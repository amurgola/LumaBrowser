# SpeechStreamChunker

`core/llm-server/ui/js/voice/SpeechStreamChunker.js`

Cuts a streamed reply into speakable sentences as deltas arrive; fenced code
is never spoken, even across deltas.

## Methods

- `push(text)` returns the complete sentences now available.
- `flush()` returns the rest at the end of the turn (an open fence is dropped) and resets.
- `reset()`.
