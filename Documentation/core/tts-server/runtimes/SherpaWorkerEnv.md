# SherpaWorkerEnv

`core/tts-server/runtimes/SherpaWorkerEnv.js`

The environment a sherpa voice worker is forked with.

## Methods

- `SherpaWorkerEnv.build(platformDir, { platform?, baseEnv? })` returns a copy of
  `baseEnv` (default `process.env`) with `platformDir` prepended
  (`dir:existing`) to `LD_LIBRARY_PATH` on Linux or `DYLD_LIBRARY_PATH` on macOS.
  Windows, or a null `platformDir`, gets an unchanged copy.
- `SherpaWorkerEnv.LIBRARY_PATH_VAR` maps platform to variable.

## Why

On Linux and macOS the addon's native library sits in the platform package
beside the wrapper (`SherpaRuntimeLayout.platformDir`) and the dynamic loader
does not find it without the path. Windows resolves DLLs next to the `.node` file.
