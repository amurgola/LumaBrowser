# MusicServerSettings

`core/music-server/service/MusicServerSettings.js`

The persisted music-server settings under `core.musicServer.*`, each read back
with a safe default, plus the runtimes and models dirs.

## Methods

- `new MusicServerSettings(settingsDb, { baseDir? })`; `baseDir()` defaults to
  `AppPaths.appBaseDir()`.
- `isEnabled()` / `setEnabled(v)`: `core.musicServer.enabled`, stored as a boolean, default false.
- `getDefaults()` from `core.musicServer.defaults`: `{ modelId (or null), seed
  (finite or null), maxDurationSec (positive, else 300), autoUnloadMs
  (non-negative, else 10 minutes) }`.
- `setDefaults(patch)` merges `patch` over the stored object (unknown keys kept)
  and returns `getDefaults()`.
- `getExtraServeArgs()`: `core.musicServer.extraServeArgs` as strings, `[]` when
  not an array.
- `getRuntimesDir()` `<base>/runtimes`.
- `getModelsDirConfig()` `{ configuredPath, effectivePath }`, the effective path
  being `core.musicServer.modelsDir` or `<base>/models/music`.
- Statics: the four keys, `DEFAULT_AUTO_UNLOAD_MS`, `DEFAULT_MAX_DURATION_SEC`.

## Why

A music reload takes minutes, so its idle default (10 minutes) is longer than
the other servers'. It lives inside `core.musicServer.defaults`, where the Music
sub-view already edits it.
