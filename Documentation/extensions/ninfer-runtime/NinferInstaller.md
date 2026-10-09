# NinferInstaller

`extensions/ninfer-runtime/NinferInstaller.js`

The `install` hook: installs NInfer end to end.

## Methods

- `NinferInstaller.install({ entry?, managedDir, onEvent?, isCanceled? })`
  (shorthand for `new ...(o).execute()`) resolves `{ binaryPath, manifest }`:
  1. WSL mode: core `Wsl.detect()`; no WSL2 distro throws `WSL_NOT_READY`, no
     GPU inside WSL throws `WSL_NO_GPU`.
  2. Install dir: `<managedDir>/ninfer` natively, `$HOME/.lumabrowser/runtimes/ninfer`
     inside the distro (`$HOME` resolved, never a quoted `~`; failure throws
     `WSL_HOME_UNRESOLVED`).
  3. Acquire: [NinferPrebuiltAcquisition](NinferPrebuiltAcquisition.md), else
     [NinferSourceBuild](NinferSourceBuild.md).
  4. Emit `extract { phase: 'done' }`, then `<installDir>/ninfer-serve --help`
     must print `usage:` (else `BINARY_NOT_RUNNABLE`).
  5. Version: `<installDir>/COMMIT` when present, else the acquired version.
  6. [NinferGpuProbe](NinferGpuProbe.md), write [NinferManifest](NinferManifest.md),
     emit `finalize { binaryPath, manifest }`.
- Errors are core `RuntimeInstallError`s with `code` (and `detail` where given);
  events go through core `InstallEvents.emitter`, so a throwing listener never
  aborts the install.

## Why

The repo never runs sudo: a missing toolchain fails with the missing pieces and
the apt line. Everything the synchronous planner needs from the distro is
probed here and read back from the manifest.
