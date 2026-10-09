# TtsServerService

`core/tts-server/TtsServerService.js`

The text-to-speech half of voice mode. Keeps one resident sherpa-onnx worker
([TtsWorker](TtsWorker.md)) with the chosen voice loaded, streams Int16 PCM per
request, unloads the worker when idle, and routes voices that belong to an
extension engine ([TtsEngineRegistry](TtsEngineRegistry.md)) to that engine.

## Methods

- `new TtsServerService(settingsDb, { engines?, fork? })`. `engines` defaults to
  `TtsEngineRegistry.shared`; `fork` defaults to Electron's `utilityProcess.fork`
  (tests pass a fake).
- `getRuntimesDir()` is `<appBaseDir>/runtimes`; `getModelsDir()` is
  `<appBaseDir>/models/tts`.
- Settings (through [TtsVoiceSettings](TtsVoiceSettings.md)):
  `getDefaultModelId` / `setDefaultModelId`, `getSid` / `setSid`,
  `getSpeed` / `setSpeed`, `getAutoUnloadMs`.
- `resolveModel()` returns the persisted voice when it still exists (a scanned
  model folder, or an extension voice as
  `{ id, external: true, engine: 'ext', engineId, voiceId, name, dir: null }`),
  else the first scanned model, else `null`.
- `getView()` returns `{ runtimeReady, runtimeVersion, runtimeOutdated,
  runtimePinnedVersion, platformSupported, models, modelCatalog,
  recommendedModelId, defaultModelId, sid, speed, workerState, workerInfo, lastError }`.
  `models` and `modelCatalog` end with the extension voices.
- `ensureRunning()` (serialized) prewarms an extension voice and resolves
  `{ modelId, engine: 'ext', engineId, external: true }`, or makes sure the
  worker is up with the current sherpa voice and resolves
  `{ numSpeakers, sampleRate, modelId, engine }`. Rejects with
  `code: 'NO_TTS_MODEL'`, or `code: 'TTS_RUNTIME_MISSING', installable: true`.
- `synthesize({ text, sid?, speed? }, onChunk)` returns `{ id, done }` at once
  (`id` is `tts-<n>`). Chunks are `{ seq, sampleRate, pcm }`; `done` resolves
  `{ canceled }`. `sid` and `speed` default to the settings.
- `cancel(id)` cancels an extension request through its engine, or tells the
  worker and resolves the request as `{ canceled: true }`.
- `stop()` stops the worker and calls `stop()` on every extension engine.
- `downloadModel(catalogId, onEvent)` installs a catalog voice through
  [TtsModelInstaller](TtsModelInstaller.md) and makes it the default on success.
- `cancelDownload()` returns whether a download was canceled.
- Getters `workerState` (`idle | starting | ready | stopping | error`),
  `workerInfo`, `lastError`.
- `TtsServerService.threadCount(cpuCount?)` is half the cores clamped to 4..12.
- Statics: `READY_TIMEOUT_MS` (120 s), `WORKER_FILE` (`TtsWorker.js`),
  `MIN_THREADS`, `MAX_THREADS`.

## Why

- A resident worker, not a process per sentence: spawning per utterance cost
  about 9 s of model load each time. Killing the worker is the way to reclaim
  its RAM (about 500 MB with Kokoro), hence the idle unload.
- The idle window never runs while a request is in flight, and expiry
  re-checks because a request can start during the window.
- Half the cores: TTS is a burst load between LLM turns. The same count picks the
  recommended voice (Kokoro needs about 8 threads to stay ahead of realtime).
- Kokoro voices get `KokoroTokenPatcher.patch` before load (best-effort), or
  word endings like "calendar" are cut.
- A worker exit fails every request in flight; an exit nobody asked for sets
  `workerState: 'error'` and `lastError`.

## Not a BaseRuntimeServer

`BaseRuntimeServer` supervises an HTTP child: a port, a health endpoint, a CUDA
device, and a force-kill of an OS process. This service supervises an Electron
`utilityProcess` speaking a message protocol, with no port, no health check and
no GPU. Only the idle unload is shared, and that is composed through
`IdleTimer`. The process supervision lives in
[SherpaWorkerProcess](runtimes/SherpaWorkerProcess.md), which the sherpa STT
backend can share.

## Collaborators

- [SherpaWorkerProcess](runtimes/SherpaWorkerProcess.md): fork, handshake, crash, stop.
- [PendingSyntheses](PendingSyntheses.md): requests in flight by id.
- [TtsExternalVoices](TtsExternalVoices.md): extension-engine routing.
- [TtsModelInstaller](TtsModelInstaller.md): voice downloads.
- `SherpaWorkerEnv.build` for the worker env, `SherpaRuntimeLayout`,
  `TtsModelsScanner`, `TtsModelCatalog`, `TtsModelConfigBuilder`.
