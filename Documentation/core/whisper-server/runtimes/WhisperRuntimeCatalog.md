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

The CPU description's em-dash was replaced with a colon (user-facing text rule).
