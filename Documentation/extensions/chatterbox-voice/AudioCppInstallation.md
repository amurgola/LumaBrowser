# AudioCppInstallation

`extensions/chatterbox-voice/AudioCppInstallation.js`

Finds installed audio.cpp builds under the managed runtimes dir, synchronously.

## Methods

- `AudioCppInstallation.findInstalledRuntime(runtimesRoot, preferredId = null, catalog?)`
  returns `{ id, binaryPath, backend }` for the preferred build when installed,
  else the first installed build in `PREFERENCE` order, else `null`.
- `AudioCppInstallation.findRuntimeBinary(runtimesRoot, id, catalog?)` returns
  the manifest's `binaryPath` when that file exists, else a search of
  `<runtimesRoot>/<id>` (depth 4), else `null` (also for an unknown id).
- `AudioCppInstallation.findBinaryIn(dir, names, maxDepth)` breadth-first,
  shallower hits first, unreadable dirs skipped.

## Why

The engine's `isReady()` is consulted synchronously by the voice picker, and
core's `BinaryLookup.findBinaryIn` is async, so this keeps its own synchronous
walk (the same shape as the whisper launcher's). Release zips nest the binary a
level or two down.
