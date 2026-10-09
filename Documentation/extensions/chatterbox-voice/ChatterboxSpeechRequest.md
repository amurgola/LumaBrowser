# ChatterboxSpeechRequest

`extensions/chatterbox-voice/ChatterboxSpeechRequest.js`

One `POST /v1/audio/speech` to the audio.cpp server.

## Methods

- `ChatterboxSpeechRequest.buildBody({ voiceId, text, speed }, store)` returns
  `{ body }` or `{ error }` (`NO_TTS_MODEL`, `Cloned voice not found.`). The body
  is `{ input, response_format: 'wav', model }`: `chatterbox-turbo` for the
  Turbo voice; `chatterbox` with `voice_ref { type: 'path', path }` (forward
  slashes), `reference_text` when set and `language` when not English for a
  cloned voice. `speed` is sent only when it differs from 1, clamped to 0.5..2.
- `ChatterboxSpeechRequest.send({ port, body, onChunk, track, untrack })`
  resolves `false` after delivering the whole clip through
  [PcmChunker](PcmChunker.md), `true` when destroyed with a canceled/stopped
  error; rejects on `Chatterbox engine HTTP <status>: <message>` (the JSON
  `error.message` when present), `returned no audio` and other request errors.
  Timeout 120 s. `track(req)` / `untrack()` let the engine cancel by id.
- Statics: `TURBO_VOICE_ID` (`'turbo'`), `REQUEST_TIMEOUT_MS`.
