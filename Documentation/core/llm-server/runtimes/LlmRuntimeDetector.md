# LlmRuntimeDetector

`core/llm-server/runtimes/LlmRuntimeDetector.js`

The LLM server's runtime detector. Extends
[RuntimeDetector](../../shared/runtime/RuntimeDetector.md) over
[LlmRuntimeCatalog](LlmRuntimeCatalog.md) for the `inference` kind, and adds
the llama.cpp version parser and the backend device check.

## Methods

- `LlmRuntimeDetector.shared` is the instance over `LlmRuntimeCatalog.shared`.
- `new LlmRuntimeDetector(catalog?)` (default `LlmRuntimeCatalog.shared`).
- `new LlmRuntimeDetector(catalog?, { sysdeps? })`; `sysdeps` (default a
  `SysdepsChecker`) names what a backend library cannot find on Linux.
- `detectRuntimes({ runtimesRoot, cuda, gpu, manualBinaries })`: inherited;
  resolves `{ runtimesRoot, platformKey, runtimes }` with one row per
  inference runtime for this host.
- `_afterDetect(detail, entry)`: for an installed GPU build (an entry with
  `backendDevice`) that ran `--version` cleanly, `listBackendDevices` runs
  [BackendDeviceCheck](../../shared/runtime/detect/BackendDeviceCheck.md) and
  [RuntimeDetailFields](../../shared/runtime/detect/RuntimeDetailFields.md)`.applyBackend`
  stores the result as `row.backend`; a backend that loaded no device flips the
  row to `hardware.ready: false` with the cause. A throwing check leaves the
  verdict open (`checked: false`).
- `listBackendDevices(binaryPath, entry)`: the seam tests override.
- `parseVersionOutput(stdout, stderr)` returns the version label:
  - nested scheme (b10400+): `version: 0.1.0-dev (build 10430, commit 4c1a0af40)`
    -> `b10430 (4c1a0af40)`;
  - flat scheme: `version: 6543 (1234567)` -> `b6543 (1234567)`, `version: b4067` -> `b4067`;
  - argparse noise (`usage:`, `unrecognized arguments`, `invalid choice`,
    `error:`) -> `null`, so a runtime without `--version` (mlx_lm.server) shows
    no version instead of an error line;
  - other output -> its first line; empty -> `null`.

Harmony (gpt-oss) once had its own `format` row rolled up from the llama.cpp
builds; every current build supports it, so the row was removed (2026-10). The
chat-side gpt-oss handling lives in `core/llm-server/chat/Harmony*.js`.

## Why

The device check exists because the ggml backends are loaded with `dlopen`
and release builds load them silently: a ROCm build without the HIP SDK, or a
Linux SYCL build without the oneAPI runtime, installs fine, reports its
version, and then computes on the CPU.
