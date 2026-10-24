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

## Release record (2026-10-22)

`findInstalledRuntime` also returns `release`, the install manifest's release
record (`{ tag, publishedAt, ... }`) or null, and `installedRelease(runtimesRoot, id)`
reads it alone. [ChatterboxModels](ChatterboxModels.md)`.runtimeSupports` compares
`publishedAt` with a model's `minRuntimePublishedAt` (KittenTTS 2 needs the
release of 2026-10-19 or newer) so the Setup tab can ask for a reinstall.
