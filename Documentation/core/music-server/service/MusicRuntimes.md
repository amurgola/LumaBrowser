# MusicRuntimes

`core/music-server/service/MusicRuntimes.js`

The music runtime surface: the cached runtimes view, manual binaries, one
python-env install at a time with cancel, uninstall and the PyPI update check.

## Methods

- `new MusicRuntimes({ settingsDb, runtimesDir, getDiagnostics, catalog?, detector?, installer?, updates? })`:
  `runtimesDir()` and `getDiagnostics()` are read live; defaults are a new
  [MusicRuntimeCatalog](../runtimes/MusicRuntimeCatalog.md),
  [MusicRuntimeDetector](../runtimes/MusicRuntimeDetector.md),
  [MusicRuntimeInstaller](../runtimes/MusicRuntimeInstaller.md) and
  [MusicRuntimeUpdates](../runtimes/MusicRuntimeUpdates.md).
- `ensureView({ force })`, `invalidateCache()`, `getManualBinary(id)`,
  `setManualBinary(id, path)` through
  [ManagedRuntimeSettings](../../shared/runtime/ManagedRuntimeSettings.md) with
  cache key `core.musicServer.runtimesCache`, manual prefix
  `core.musicServer.runtimes.`, kind `music-inference`, fallback ids `['sglang-omni']`.
- `install(id, { onEvent })` throws `A runtime install is already running.`
  while one runs; otherwise runs `installer.installRuntime(id, { runtimesRoot,
  onEvent, isCanceled })` and invalidates the view afterwards, success or not.
- `cancelInstall()` makes `isCanceled()` true for the running install.
- `uninstall(id)` runs `installer.uninstallRuntime(id, { runtimesRoot })`, then
  invalidates the view.
- `checkUpdates({ force })` decorates the view through the one updates instance
  with user agent `LumaBrowser`.
- Statics: `CACHE_KEY`, `MANUAL_BINARY_PREFIX`, `RUNTIME_KIND`, `FALLBACK_IDS`,
  `USER_AGENT`, `BUSY_MESSAGE`.

## Why

MusicRuntimeUpdates keeps its PyPI TTL cache on the instance, so this class
holds one for the life of the service. The persisted keys are passed in whole,
never derived, because renaming them would orphan users' cached views and
registered binaries.
