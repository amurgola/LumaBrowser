# VoiceSurface

`core/shell/extensions/VoiceSurface.js`

`context.voice`: alternate TTS engines and the app's speech recognizer.

## Methods

- `new VoiceSurface({ registry = TtsEngineRegistry.shared, coreServices })`; `key` is `voice`.
  `coreServices.ttsServer` and `coreServices.sttServer` are read at call time.
- `forExtension(id)` ->
  - `registerTtsEngine(engine)`, `unregisterTtsEngine(engineId)`, `listTtsEngines()` -> `[{ id, name }]`;
  - `voiceModelId(engineId, voiceId)` -> `ext:<engine>:<voice>`;
  - `getDefaultTtsModelId()` (null without a TTS server);
  - `setDefaultTtsVoice(voiceId)` stores `ext:<extensionId>:<voiceId>`, or `''`
    for null; false without a TTS server;
  - `transcribe(wav, opts)` resolves `{ text, durationMs }`; rejects with
    `code: 'NO_STT_MODEL'` and `Speech recognition is not available in this build.`
    when there is no recognizer;
  - `sttReady()` resolves true when the recognizer view has `runtimeReady` and a model.
