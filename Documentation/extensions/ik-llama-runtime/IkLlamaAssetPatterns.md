# IkLlamaAssetPatterns

`extensions/ik-llama-runtime/IkLlamaAssetPatterns.js`

Release-asset regexes for Thireus's ik_llama.cpp feed.

## Methods

- `IkLlamaAssetPatterns.assetPatternsFor(backend, isa)` returns platform-keyed
  regexes: `cpu` (win32-x64 `bin-win-cpu-x64-<isa>`, linux-x64
  `bin-ubuntu-x64-<isa>`, darwin-arm64 `bin-macos-arm64`, darwin-x64
  `bin-macos-x64-<isa>`), `vulkan` (linux-x64 only), `cuda12` / `cuda13`
  (win32-x64 and linux-x64, `cuda-<major>[.<minor>]`). Throws
  `ik-llama-runtime: unknown backend <backend>` otherwise.
- `IkLlamaAssetPatterns.companionPatternsFor(backend, isa)` returns the
  `ik_llama-cudart-main-...` bundle regexes for the CUDA backends, else `undefined`.

## Why

Assets are named `ik_llama-main-<tag>-bin-<os>[-<backend>]-x64-<isa>.zip`. The
feed also publishes per-microarchitecture tunings (`-x64-znver4-<isa>`,
`-win-cpu-raptorlake-<isa>`) that the `-x64-<isa>` tail deliberately excludes:
the generic build of an ISA level runs on every CPU of that level. All regexes
are case-insensitive.
