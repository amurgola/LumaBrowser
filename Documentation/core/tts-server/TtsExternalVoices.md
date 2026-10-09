# TtsExternalVoices

`core/tts-server/TtsExternalVoices.js`

Routes voices that belong to an extension TTS engine (`ext:<engineId>:<voiceId>`)
to that engine, on behalf of `TtsServerService`.

## Methods

- `new TtsExternalVoices(registry)` (a `TtsEngineRegistry`).
- `describe(modelId)` returns
  `{ id, external: true, engine: 'ext', engineId, voiceId, name, dir: null }`
  (name falls back to the voice id), or `null` when the id is not an extension
  voice or its engine or voice is gone.
- `catalogRows()` is `registry.listVoiceEntries()`.
- `TtsExternalVoices.modelRow(entry)` shapes a picker row as a model:
  `{ id, name, dir: null, engine: 'ext', external: true, sizeBytes: 0 }`.
- `prewarm(model)` calls the engine's optional `prewarm(voiceId)` and resolves
  `{ modelId, engine: 'ext', engineId, external: true }`.
- `synthesize(id, modelId, { text, speed }, onChunk)` calls the engine and
  resolves `{ canceled }`. Rejects `code: 'NO_TTS_MODEL'` ("The selected voice is
  no longer available.") when the voice vanished.
- `cancel(id)` cancels by the service's request id; returns whether it was an
  external request.
- `stopAll()` calls each engine's optional `stop()`, ignoring failures.

## Why

A deactivated extension simply stops resolving, so the service falls back to the
built-in voices instead of wedging voice mode. Handles are keyed by the service's
own request id because callers only know that id.
