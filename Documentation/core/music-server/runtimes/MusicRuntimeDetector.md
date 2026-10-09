# MusicRuntimeDetector

`core/music-server/runtimes/MusicRuntimeDetector.js`

Detects the python-env music runtimes (SGLang-Omni) and reports each in the
shared detector's row shape, so ManagedRuntimeSettings, preflight and the
runtime cards treat it like a llama.cpp or sd.cpp row.

## Methods

- `new MusicRuntimeDetector({ catalog? })`, `catalog` defaults to
  `new MusicRuntimeCatalog()`.
- `detectRuntimes({ runtimesRoot, cuda, gpu, manualBinaries })` resolves
  `{ runtimesRoot, platformKey, runtimes }` for every `music-inference` entry
  whose `platforms` include this host. On win32 it runs one `Wsl.detect()` per
  call. Row fields: `id, name, kind, description, requirementNote, installed,
  source ('managed' | 'manual' | null), managedDir, binaryPath, version,
  manifest, manualBinaryPath, staleManualRegistration, acquisition:
  'python-env', assetSupported, supportsManualRegister: true, manualSourceUrl:
  null, manualSourceNote: null, pythonPackage, protocol, platforms, hardware, wsl`.
  - managed: `manifest.binPath` is executable (`test -x` inside
    `manifest.distro` when `mode: 'wsl'`, else `fs.access(X_OK)`); `version` is
    `manifest.package.version`.
  - manual: the registered path is executable; on win32 a path starting with
    `/` is checked inside the default WSL distro.
  - `assetSupported` (one-click install possible): always on Linux; on Windows
    only with a WSL2 distro whose GPU is visible.
  - `wsl`: `{ present, wsl2, distro, nvidiaDriverOk, note }` on win32, else `null`.
- `MusicRuntimeDetector.hardwareEvaluation(entry, { cuda, wsl })` returns
  `{ ready, note }`: no CUDA gives
  [RuntimeHardwareCheck](../../shared/runtime/detect/RuntimeHardwareCheck.md)`.cudaUnavailableNote`;
  on win32 it also needs WSL2 (`WSL2 is required on Windows. Run: wsl --install`
  or the probe's note) and a GPU-visible distro.

## Why

It does not extend [RuntimeDetector](../../shared/runtime/RuntimeDetector.md):
that base probes native binaries (managed dir, PATH, `--version`), while a
python-env runtime is "installed" when its venv entrypoint exists, and on
Windows that venv lives inside a WSL2 distro where `fs` cannot look. The
manifest written by [MusicRuntimeInstaller](MusicRuntimeInstaller.md) is the
source of truth for mode, distro, entrypoint and version. Detection is
fail-soft: a probe failure reads as "not installed".
