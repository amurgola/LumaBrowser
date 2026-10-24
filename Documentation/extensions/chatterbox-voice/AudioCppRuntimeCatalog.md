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

## Suffixed release tags (2026-10-22)

audio.cpp's 2026-10-19 release is tagged `v0.9.2-drama3-base-small` and names its assets `audio-v0.9.2-drama3-base-small-bin-windows-x64-cpu.zip`, so every pattern allows an optional lower-case suffix after the version (`(?:-[a-z0-9-]+?)?`). The `-portable`, `-lib-` and `-cudart-` twins still do not match the binary patterns (the literal tail must follow directly). Without this the core resolver walked back to v0.9.2 (2026-10-15), which cannot load KittenTTS 2.
