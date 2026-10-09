# RuntimeSpawnEnv

`core/shared/runtime/server/RuntimeSpawnEnv.js`

Builds the cwd and environment a native inference child is spawned with.

## Methods

- `RuntimeSpawnEnv.build(binaryPath, { cudaDevice, env = process.env, platform = process.platform })`
  returns `{ cwd, env }`: `cwd` is the binary's directory; `env` is a copy with
  that directory prepended to `Path` (win32) or `PATH` (once, compared
  case-insensitively), prepended to `LD_LIBRARY_PATH` on Linux, and the CUDA
  pin applied by `CudaPin.applyCudaDeviceEnv`. The source env is not modified.
- `RuntimeSpawnEnv.isPinned(cudaDevice)` false for null, undefined and `''`.

## Why

On Windows the CUDA backend finds `cudart64_12.dll` and cuBLAS through the
current-directory search when the EXE-dir lookup is not honoured, and some
libraries call LoadLibrary with flags that skip the EXE dir, hence both cwd and
PATH. The Linux loader never searches the executable's directory and release
binaries carry a useless build-host RUNPATH; the installer consolidates every
shared library into the binary dir, so `LD_LIBRARY_PATH` resolves them.
