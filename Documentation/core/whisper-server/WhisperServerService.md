# WhisperServerService

`core/whisper-server/WhisperServerService.js`

The speech-to-text half of voice conversation mode. One interface (`getView`,
`ensureRunning`, `transcribe`, `stop`) over two backends, chosen by the selected
model's engine:

- `sherpa`: Parakeet TDT v3 or Qwen3-ASR in a resident utilityProcess on the
  sherpa-onnx addon the TTS half already installs
  ([SherpaSttBackend](sherpa/SherpaSttBackend.md)). The default.
- `whisper`: whisper.cpp's whisper-server over HTTP
  ([WhisperRuntimeServer](server/WhisperRuntimeServer.md), launched by
  [WhisperServerLauncher](server/WhisperServerLauncher.md)).

## Construction

`new WhisperServerService(settingsDb, { runtimeServer?, launcher?, sherpa?, catalog?, installerOptions? })`.
Production passes only `settingsDb`; the options are test seams (a
WhisperRuntimeServer, a WhisperServerLauncher, a SherpaSttBackend, an
[SttModelCatalog](models/SttModelCatalog.md), and extra
[SttModelInstaller](service/SttModelInstaller.md) options). Construction applies
the idle window to both backends. `runtimeServer` is a public field (main
watches its state for the "failed to load" toast).

## Methods

- Paths under `AppPaths.appBaseDir()`: `getRuntimesDir()` (`runtimes`),
  `getModelsDir()` (`models/whisper`), `getSherpaModelsDir()` (`models/stt`).
- Settings ([SttSettings](service/SttSettings.md)): `getDefaultModelPath()`,
  `setDefaultModelPath(p)` (empty clears), `getLanguage()`, `setLanguage(l)`,
  `getAutoUnloadMs()`.
- `listModels()` every installed model, sherpa first
  ([SttModelLibrary](service/SttModelLibrary.md)); `resolveModel()` the model a
  launch would use, or null; `resolveModelPath()` its path.
- `async getView()` the voice setup snapshot: the runtime fields of
  [SttRuntimeView](service/SttRuntimeView.md) (`runtimes`, `runtimeReady`,
  `sherpaRuntimeReady`, `whisperRuntimeReady`, `activeRuntimeId`,
  `recommendedRuntimeId`, `recommendedWhisperRuntimeId`) plus `models`,
  `modelCatalog`, `defaultModelPath`, `defaultModelId`, `defaultEngine`,
  `recommendedModelId`, `language` and `serverState` (the state of the backend
  for the default engine).
- `ensureRunning()` serialized. No model: `NO_STT_MODEL`. A sherpa model stops
  a non-idle whisper-server, then `sherpa.ensureRunning(model)` (which throws
  `STT_RUNTIME_MISSING`, `installable: true`, without the addon). A whisper
  model stops a non-idle sherpa worker, reuses a ready server on the same model
  path (`markActive`), else stops a server that is neither idle nor errored and
  starts `launcher.resolveLaunch(...)` with a 90 s health timeout. Resolves the
  backend's status (sherpa's carries `engine: 'sherpa'`).
- `transcribe(wav, { language? })` resolves `{ text, durationMs }`. Audio under
  100 bytes throws `transcribe: empty audio`. The language is the option, else
  the setting, else `auto`, lowercased. Whisper requests go through
  [WhisperInferenceClient](service/WhisperInferenceClient.md) with `markActive`
  before and after.
- `stop()` stops the sherpa worker (errors ignored) and the whisper server.
- `getStatus()` the sherpa status when its worker is not idle, else the whisper
  server's.
- `downloadModel(catalogId, onEvent)` via SttModelInstaller; a successful result
  becomes the default model (`result.destPath`, the file or the extracted dir).
  `cancelDownload()` is true when a download was running.
- Statics: `SHERPA_RUNTIME_ID` (`sherpa-onnx`), `WHISPER_HEALTH_TIMEOUT_MS`,
  `MIN_AUDIO_BYTES`, `NO_MODEL_MESSAGE`.

## Why

The persisted default is one path string (a `.bin` file for whisper, a model dir
for sherpa), so consumers (voice controller, On Demand, the sharing router,
extensions) only ever see `{ text, durationMs }` and the `NO_STT_MODEL` /
`STT_RUNTIME_MISSING` codes. Switching engines stops the other backend first so
two recognizers never sit in RAM. It shares no base class with
[TtsServerService](../tts-server/TtsServerService.md): that class supervises one
worker itself, while this one dispatches between two backends that each
supervise their own.
