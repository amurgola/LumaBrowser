# ChatterboxSpeechRequest

`extensions/chatterbox-voice/ChatterboxSpeechRequest.js`

One `POST /v1/audio/speech` to the audio.cpp server.

## Methods

- `ChatterboxSpeechRequest.buildBody({ voiceId, text, speed }, store, { kittenPreset?, cloneModelId? })`
  returns `{ body }` or `{ error }` (`NO_TTS_MODEL`, `Cloned voice not found.`;
  `NO_REFERENCE_TEXT` when KittenTTS 2 is to clone a voice with no transcript).
  The body is `{ input, response_format: 'wav', model }`: `chatterbox-turbo`
  for the Turbo voice; `kitten-tts2` with `voice` (the preset, validated
  through `ChatterboxModels.presetFor`) for the KittenTTS 2 built-in voice;
  `cloneModelId` (default `chatterbox`) with `voice_ref { type: 'path', path }`
  (forward slashes) and `reference_text` when set for a cloned voice, plus
  `language` when not English for Chatterbox only. `speed` is sent only when it
  differs from 1, clamped to 0.5..2, and never to a model whose
  `acceptsSpeed` is false (audio.cpp answers 500 for KittenTTS 2).
- `ChatterboxSpeechRequest.send({ port, body, onChunk, track, untrack })`
  resolves `false` after delivering the whole clip through
  [PcmChunker](PcmChunker.md), `true` when destroyed with a canceled/stopped
  error; rejects on `Chatterbox engine HTTP <status>: <message>` (the JSON
  `error.message` when present), `returned no audio` and other request errors.
  Timeout 120 s. `track(req)` / `untrack()` let the engine cancel by id.
- Statics: `TURBO_VOICE_ID` (`'turbo'`), `KITTEN_VOICE_ID` (`'kitten'`), `REQUEST_TIMEOUT_MS`.
