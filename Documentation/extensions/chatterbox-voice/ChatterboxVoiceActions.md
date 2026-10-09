# ChatterboxVoiceActions

`extensions/chatterbox-voice/ChatterboxVoiceActions.js`

The Setup tab's voice-profile actions. Reference clips arrive from the renderer
as base64 WAV (`audioBase64`, 12 MB max).

## Methods

- `handles(action)`, `handle(action, payload)`:
  - `voices.create { name, description?, language?, referenceText?, trimStartSec?, audioBase64, makeDefault? }`
    -> `{ voice }`; stops the engine (presets are baked into the server config);
    `makeDefault` selects it in chat. No clip rejects `Add a reference clip first ...`.
  - `voices.update { id, patch, audioBase64?, trimStartSec? }` -> `{ voice }`;
    a new clip stops the engine.
  - `voices.delete { id }` -> `{ removed }`; clears the chat default if it was this voice.
  - `voices.use { id | null }` -> `{ activeVoiceId }`; a voice whose model is not
    downloaded rejects `That voice is not ready: download the model it needs first.`
  - `voices.clip { id }` -> `{ wavBase64, seconds, hz }` of the stored clip.
  - `voices.analyze { audioBase64 }` -> `AudioAnalysis.analyzeWav`.
  - `voices.transcribe { audioBase64 | id, language? }` -> `{ text, durationMs }`
    through `context.voice.transcribe` (language default `auto`); the STT
    codes `NO_STT_MODEL` / `STT_RUNTIME_MISSING` become `Speech recognition is
    not set up yet. Click the microphone in the chat once to install it, then try again.`
  - `voices.preview { id, text? }` -> [VoicePreview](VoicePreview.md).
- `ChatterboxVoiceActions.clipFromPayload(payload)` returns the clip Buffer or
  null; throws `Reference clip is too large (12 MB max).`
