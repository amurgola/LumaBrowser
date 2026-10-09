# PartialTranscriber

`core/llm-server/ui/js/voice/PartialTranscriber.js`

Rolling live transcript: re-transcribes the utterance so far every 1.2 s
(once it is at least 0.6 s long), one request at a time, ignoring results that
arrive after the utterance ended.

## Methods

- `new PartialTranscriber({ api, transcript, frames, sampleRate })`; `start()`,
  `stop()`, `invalidate()`; `ANNOTATIONS` (whisper's `[...]` and `(...)` notes).
