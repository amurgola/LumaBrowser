# WhisperRuntimeCatalog

`core/whisper-server/runtimes/WhisperRuntimeCatalog.js`

The runtime catalog for whisper.cpp's `whisper-server`. Extends
[RuntimeCatalog](../../shared/runtime/RuntimeCatalog.md) and is consumed by the
shared installer like the LLM and image catalogs.

## Methods

- `new WhisperRuntimeCatalog()` wraps `WhisperRuntimeCatalog.RUNTIMES`.
- Inherited: `getCatalog`, `getById`, `platformKey`, `getAssetPattern`,
  `getRepo`, `getCompanionAssetPatterns`, `getBinaryNames`, `fingerprint`.
- Statics: `RUNTIMES` (`whisper-cpp-cpu`, `whisper-cpp-cublas`, both
  `kind: 'stt-inference'`), `BINARY_NAMES` (`whisper-server[.exe]`),
  `MANUAL_DARWIN` (manual-source URL and build note).

## Why

Asset names were verified against ggml-org/whisper.cpp v1.9.1:
`whisper-bin-x64.zip` (Windows CPU), `whisper-cublas-12.4.0-bin-x64.zip`
(Windows CUDA 12; 11.8 is deliberately not matched),
`whisper-bin-ubuntu-x64.tar.gz` (Linux CPU). Upstream ships CUDA builds for
Windows only and no macOS server binary (xcframework only), so every entry is
manual-source on darwin: build with cmake and register via Locate. The tests
pin the real asset list so an upstream rename trips them.

Build b5454 (2026-10) renamed the x64 CUDA zip to
`whisper-bin-win-cuda-12.4.0-x64.zip` (both names match) and added Windows on
Arm: `whisper-bin-win-cpu-arm64.zip` and `whisper-bin-win-cuda-13.4-arm64.zip`,
which `whisper-cpp-cpu` and `whisper-cpp-cublas` now take on `win32-arm64`, plus
`whisper-bin-ubuntu-arm64.tar.gz` for `linux-arm64`. The arm64 CUDA build is
CUDA 13 only; `requiresHw` stays at CUDA 12 because every NVIDIA Windows on Arm
machine ships an R580+ driver. Semver releases (v1.9.5) carry no assets; the
resolver walks back to the newest `bNNNN` release that has one.
`MANUAL_DARWIN`'s note no longer names macOS alone, since any host without an
asset falls back to it.

The CPU description's em-dash was replaced with a colon (user-facing text rule).
