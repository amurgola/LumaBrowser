# ReadAloudReader

`core/llm-server/ui/js/voice/ReadAloudReader.js`

Reads one committed reply, independent of the loop: chunks fed two at a time,
stale requests dropped after 60 s, an engine refusal drops the rest.

## Methods

- `new ReadAloudReader({ api, onChange, scheduler? })`; `start(key, chunks)`,
  `stop()` (aborts in-flight requests), `key`, `state` (`'starting'`, `'playing'`, `null`), `active`.
- `onChange(key, state)` on start, first audio and end.
