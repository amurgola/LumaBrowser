# BasaltInstaller

`extensions/basalt-runtime/BasaltInstaller.js`

The `install` hook: installs the Basalt build a row names, end to end.

## Methods

- `BasaltInstaller.install({ entry, runtimesRoot, managedDir, onEvent, isCanceled })`
  resolves `{ success, binaryPath, manifest }`. The build is
  [BasaltCatalog](BasaltCatalog.md)`.buildFor(entry.id)`; a row that is no
  Basalt build throws `UNKNOWN_BUILD`. Steps, in order:
  1. core `CudaProbe.probe` (with the nvidia-smi path diagnostics settled on)
     and [BasaltCard](BasaltCard.md)`.pick`; no Blackwell card is
     `NO_BLACKWELL_GPU`, before anything is fetched;
  2. [BasaltPythonFinder](BasaltPythonFinder.md)`.find`, also before the download;
  3. [BasaltReleaseArchive](BasaltReleaseArchive.md)`.install` of that build;
  4. [BasaltCudaRuntime](BasaltCudaRuntime.md)`.install` into the archive's
     `bin`, with [BasaltCudaCompanion](BasaltCudaCompanion.md) as the fetch;
  5. [BasaltVenv](BasaltVenv.md)`.create`, then `extract` done;
  6. `manifest.json` through core `RuntimeManifest.write`: `id` (the
     build's row id), `installedAt`, `release` (the build's tag and release
     page, channel `stable`), `asset`, `binary`
     (relative to the managed dir), `python`, `cudaRuntime` (where the
     libraries came from), `gpu` (the picked card); then `finalize`.
  A cancel is checked between steps (`CANCELED`).
- The constructor's second argument replaces step functions (`probeCuda`,
  `findPython`, `archive`, `cudaRuntime`, `venv`) for tests.

## Why

Both refusals come first so a host that cannot run Basalt downloads nothing.
The card is kept in the manifest so the synchronous planner still has an index
and VRAM figure when a diagnostics snapshot is missing. Events are the shared
installer's (`resolved`, `download`, `extract`, `finalize`), so the Setup
tab's progress UI works unchanged.
