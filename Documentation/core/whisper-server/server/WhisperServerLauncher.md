# WhisperServerLauncher

`core/whisper-server/server/WhisperServerLauncher.js`

Resolves which installed whisper.cpp runtime to launch for a speech-to-text
model and plans its argv with [WhisperLaunchPlanner](WhisperLaunchPlanner.md)
on a free port from [WhisperRuntimeServer](WhisperRuntimeServer.md). The
caller (WhisperServerService) hands the result to `WhisperRuntimeServer.start`.

## Methods

- `new WhisperServerLauncher({ catalog?, planner?, findFreePort? })`; defaults
  are a [WhisperRuntimeCatalog](../runtimes/WhisperRuntimeCatalog.md), a
  WhisperLaunchPlanner and `WhisperRuntimeServer.findFreePort()`.
- `async resolveLaunch({ runtimesRoot, modelPath, language?, threads? })`
  returns the planner's `{ binaryPath, args, plan }` with `plan.runtimeId` set.
  Throws, in this order:
  - `NO_STT_MODEL` `No speech-to-text model installed. Download one in the voice setup.`
    when `modelPath` is empty or not on disk;
  - `STT_RUNTIME_MISSING` (`installable: true`) `The whisper.cpp runtime is not installed yet.`
- `async findInstalledRuntime(runtimesRoot)` the first installed runtime in
  `RUNTIME_PREFERENCE` (`whisper-cpp-cublas`, then `whisper-cpp-cpu`) as
  `{ id, binaryPath }`, or null.
- `async findRuntimeBinary(runtimesRoot, id)` the binary for one runtime, or
  null: a `manifest.json` `binaryPath` (written by Locate) that still exists,
  else a breadth-first search of `<runtimesRoot>/<id>` up to depth 3
  ([BinaryLookup](../../shared/runtime/BinaryLookup.md)). Unknown ids are null.
- Statics: `RUNTIME_PREFERENCE`, `SEARCH_DEPTH` (3), `NO_MODEL_MESSAGE`,
  `RUNTIME_MISSING_MESSAGE`.

## Why

No VRAM planning or context sizing: whisper models are small and the cuBLAS
build manages its own GPU memory. `findRuntimeBinary` is the single answer to
"is this runtime usable?": the voice setup's per-runtime installed pills and
`findInstalledRuntime` must agree, because a Locate'd build that transcribes
fine once read as missing (bug M19).
