# SherpaRuntimeLayout

`core/tts-server/runtimes/SherpaRuntimeLayout.js`

Where the sherpa-onnx Node addon (the shared speech runtime for TTS and sherpa
STT) lives on disk, its pinned version, and whether it is installed.

## Methods

- `SherpaRuntimeLayout.platformPackageName()` returns
  `sherpa-onnx-<win|linux|darwin>-<arch>` for win-x64, linux-x64, linux-arm64,
  darwin-x64, darwin-arm64; else `null`.
- `SherpaRuntimeLayout.tarballUrl(packageName, version)` returns the public npm
  registry tarball URL.
- `SherpaRuntimeLayout.runtimeDir(runtimesRoot)` is `<root>/tts-sherpa`.
- `SherpaRuntimeLayout.addonDir(runtimesRoot)` is
  `<root>/tts-sherpa/node_modules/sherpa-onnx-node` (what the worker requires).
- `SherpaRuntimeLayout.platformDir(runtimesRoot)` is the platform package beside
  it (the shared-library path on Linux and macOS), or `null` when unsupported.
- `SherpaRuntimeLayout.manifestPath(runtimesRoot)` is `<root>/tts-sherpa/manifest.json`.
- `SherpaRuntimeLayout.isInstalled(runtimesRoot)` needs both
  `sherpa-onnx.js` in the wrapper and `sherpa-onnx.node` in the platform package.
- `SherpaRuntimeLayout.installedVersion(runtimesRoot)` reads the manifest
  version, `null` when missing or corrupt.
- Statics: `VERSION` ('1.13.8'), `DIR_NAME` ('tts-sherpa'), `ADDON_PACKAGE`,
  `SUPPORTED_PLATFORMS`.

## Why

The two packages sit side by side under `node_modules` because that matches the
wrapper's own relative-require fallback (`../sherpa-onnx-<plat>-<arch>/sherpa-onnx.node`),
so requiring the wrapper from an absolute path just works, in the worker process.

The version is pinned because the addon and platform package must match exactly
and the worker's API surface (createAsync / generateAsync with onProgress,
OfflineRecognizer decodeAsync) is verified at it. Bump deliberately and re-run
the live sherpa harness in Electron-as-Node. 1.13.4 -> 1.13.8 (2026-10-03) added
Supertonic 3, Kitten v0.8, Intel NPU and the Qwen3-ASR fp32-init fix.
