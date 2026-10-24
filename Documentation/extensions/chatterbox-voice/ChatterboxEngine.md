# ChatterboxEngine

`extensions/chatterbox-voice/ChatterboxEngine.js`

The TTS engine registered with `context.voice`, implementing the duck-typed
contract of core [TtsEngineRegistry](../../core/tts-server/TtsEngineRegistry.md)
on top of the audio.cpp server.

## Methods

- `new ChatterboxEngine({ store, runtimesDir, modelsDir, preferredRuntimeId, idleMs, kittenPreset?, cloneModelId?, log? })`
  (all but `store` and `log` are getters, read per call); `id` `'chatterbox-voice'`, `name`
  `'Chatterbox'`, `server` an [AudioCppServer](AudioCppServer.md).
- `listVoices()`: Turbo's built-in voice (`id: 'turbo'`, `quality: 'turbo'`)
  when its GGUF is downloaded, the KittenTTS 2 built-in voice (`id: 'kitten'`,
  `quality: 'preset'`, named `KittenTTS 2 (<preset>)`) when its GGUF is
  downloaded and the installed audio.cpp can load it, plus every stored voice
  (`quality: 'clone'`) when `cloneModelId()` finds a cloner.
- `cloneModelId()`: the chosen cloning model when it clones and is usable, else
  the first usable of `ChatterboxModels.CLONE_PREFERENCE`, else null.
  `kittenPreset()`: the stored KittenTTS 2 voice when valid, else `Bruno`.
  `modelUsable(id)`: downloaded and supported by `installedRelease()` (the
  install manifest's release record, or null).
- `isReady(voiceId)`: `{ ready: true }`, or `{ ready: false, code: 'NO_TTS_MODEL' }`
  for an unknown voice, `'TTS_RUNTIME_MISSING'` without an installed build.
- `synthesize({ voiceId, text, speed }, onChunk)` returns `{ id: 'cb-<n>', done }`;
  `done` resolves `{ canceled }` after ensuring the server and sending one
  [ChatterboxSpeechRequest](ChatterboxSpeechRequest.md). Blank text sends
  nothing; an unknown cloned voice rejects `NO_TTS_MODEL`.
- `cancel(id)` destroys the in-flight request (the request resolves canceled).
- `prewarm(voiceId)` ensures the server and speaks `Ready.` silently, returning
  `{ modelId, port, runtimeId }`.
- `stop()` aborts in-flight requests and stops the server.
- `ensureRunning()` serializes starts; it restarts the server when the
  preferred build or the voice set changed since launch.
- `getStatus()` is the server status. `ChatterboxEngine.TURBO_VOICE_ID`.

## Why

One picker row stands for KittenTTS 2 rather than 123: the Setup tab chooses
the built-in voice, and the request names it, so changing it needs no server
restart. Cloned voices go to one model at a time (the "Clone with" choice);
KittenTTS 2 refuses a clip without its transcript, which `buildBody` reports
before the 3 GB model loads. An audio.cpp build older than the model's
requirement hides the KittenTTS 2 voices instead of letting the server fail.

audio.cpp's Chatterbox path is offline only (no streaming), so first audio
equals whole-sentence synthesis time: sub-second on a GPU build, several
seconds on CPU. The prewarm moves the 2 GB lazy GGUF load off the first real
sentence. Presets are baked into the server config, so a voice-set change
relaunches it.
