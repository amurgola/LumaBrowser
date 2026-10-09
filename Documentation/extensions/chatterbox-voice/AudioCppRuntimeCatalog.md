# AudioCppRuntimeCatalog

`extensions/chatterbox-voice/AudioCppRuntimeCatalog.js`

The audio.cpp builds the add-on can install. Extends core
[RuntimeCatalog](../../core/shared/runtime/RuntimeCatalog.md).

## Methods

- `AudioCppRuntimeCatalog.shared` is the instance over `RUNTIMES`;
  `new AudioCppRuntimeCatalog(runtimes?)` for tests.
- `availableForHost()` returns the `PREFERENCE` ids that have an asset for this
  host, fastest first.
- Inherited: `getCatalog`, `getById`, `getAssetPattern`, `getCompanionAssetPatterns`,
  `getBinaryNames`, `getRepo`, `fingerprint`.
- Statics: `REPO` (`0xShug0/audio.cpp`), `KIND` (`'audio-inference'`),
  `BIN_NAMES` (`audiocpp_server[.exe]`), `PREFERENCE` (cuda13, cuda12, metal,
  vulkan, cpu), `RUNTIMES`.

## Rows

`audiocpp-cuda12` and `audiocpp-cuda13` (Windows x64, with the matching cudart
companion zip), `audiocpp-vulkan` (Windows, Linux), `audiocpp-metal` (macOS
arm64, x64), `audiocpp-cpu` (Windows, Linux). Each has `backend` (`cuda`,
`vulkan`, `metal`, `cpu`), `description`, `requiresHw`, and a `sizeNote`.

## Why

Asset regexes are verified against v0.9.0 (2026-09-30). The `-portable` twins
and the Colab-targeted Linux CUDA build are deliberately not matched. `KIND` is
the add-on's own so the installer's kind gate rejects a core runtime id passed
by mistake.
