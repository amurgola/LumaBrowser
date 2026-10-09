# ElectronBytecodeRunner

`tools/build/bytecode/ElectronBytecodeRunner.js`

Compiles files to `.jsc` by launching `scripts/bytecode-compiler` (a GUI-less
Electron app) with the project's Electron. Compiling inside a real Electron main
process keeps the V8 flag hash identical to the packaged app's; bytenode's
`electron: true` (ELECTRON_RUN_AS_NODE) stopped matching in Electron 43 and
shipped builds that died with cachedDataRejected. `ELECTRON_RUN_AS_NODE` is
removed from the child's environment.

The host's CPU arch is baked into the bytecode: each build leg must run on a host
of the target arch (an x64 Mac build needs an Intel runner).

## Methods

- `new ElectronBytecodeRunner({ electronPath, spawn, compilerDir })` (seams for tests).
- `compile(jsFiles, workDir)`: `Map(input -> error)` for failures. Throws when the
  child wrote no results (a headless Linux host needs `xvfb-run`).
