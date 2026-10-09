# SttRuntimeView

`core/whisper-server/service/SttRuntimeView.js`

The runtime half of the voice setup view: the shared sherpa-onnx engine plus
each whisper.cpp runtime with its installed pill, readiness for the model that
would run, and what one-click setup should install.

## Methods

- `new SttRuntimeView({ launcher, catalog?, platform? })`: `launcher` is a
  [WhisperServerLauncher](../server/WhisperServerLauncher.md) (or anything with
  async `findInstalledRuntime(root)` and `findRuntimeBinary(root, id)`);
  `catalog` defaults to a [WhisperRuntimeCatalog](../runtimes/WhisperRuntimeCatalog.md),
  `platform` to `process.platform`.
- `async build(runtimesRoot, model)` returns `{ engine, runtimes, runtimeReady,
  sherpaRuntimeReady, whisperRuntimeReady, activeRuntimeId, recommendedRuntimeId,
  recommendedWhisperRuntimeId }`.
  - `engine` is the model's engine; with no model, `sherpa` unless only a
    whisper runtime is installed.
  - `runtimes` starts with `{ id: 'sherpa-onnx', name, description, installed,
    requirementNote: null, engine: 'sherpa', platformSupported }`, then one row
    per catalog runtime `{ id, name, description, installed, requirementNote,
    engine: 'whisper' }`, installed when it is the active runtime or
    `findRuntimeBinary` finds it.
  - `runtimeReady` is the sherpa addon for `sherpa`, an installed whisper
    runtime for `whisper`. `activeRuntimeId` is `sherpa-onnx`, the installed
    whisper runtime id, or null.
- `recommendedRuntimeId(runtimesRoot, engine = 'sherpa')`: `sherpa-onnx` for
  sherpa; for whisper, `whisper-cpp-cublas` on Windows when
  `llama-cpp-cuda13` or `llama-cpp-cuda12` is a non-empty dir, else `whisper-cpp-cpu`.
- Statics: `SHERPA_RUNTIME_ID`, `SHERPA_ROW`, `CUDA_LLAMA_RUNTIMES`,
  `WHISPER_CUDA_ID`, `WHISPER_CPU_ID`.

## Why

"Ready" is relative to the model that would actually run: a host with only the
sherpa addon and Parakeet is ready without whisper.cpp. A host that installed a
CUDA llama.cpp runtime is a CUDA host, so no hardware probe is needed for the
whisper recommendation. The pills and the active runtime both ask
`findRuntimeBinary`, so a Locate'd build reads as installed (bug M19).
