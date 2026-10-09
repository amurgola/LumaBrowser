# AppPaths

`core/shared/AppPaths.js`

Decides the base directory under which the LLM, image, TTS, whisper and music
servers create their managed `models/` and `runtimes/` folders.

## Methods

- `AppPaths.appBaseDir()` returns the base dir for this process, resolved once
  through a shared instance bound to Electron's `app`.
- `AppPaths.appBaseDirMigration()` returns `{ from, to }` when this boot moved
  the base off the exec dir, else `null`. Only meaningful after `appBaseDir()`.
- `new AppPaths({ app, env, platform, execPath })` builds an instance with
  injected dependencies (tests, or any caller that must not touch Electron).
  - `resolveBaseDir()` picks (and memoises) the base dir, migrating if needed.
  - `migration()` returns the recorded move or `null`.

## Rules

- Dev (`!app.isPackaged`): the app source root (`app.getAppPath()`).
- Packaged builds never use the install location, because updates replace it
  wholesale (the NSIS updater deletes the install dir; macOS swaps the `.app`):
  - Linux AppImage (`APPIMAGE` set): `userData`, since the mount is read-only.
  - Windows portable (`PORTABLE_EXECUTABLE_DIR` set): that folder, which holds
    the portable `.exe`. `execPath` points at the temp unpack dir there.
  - Windows installed: `%LOCALAPPDATA%\LumaBrowser` (or `userData` without
    `LOCALAPPDATA`), per-user, non-roaming, and usually on the same volume as
    the default install dir so the migration below is a cheap rename.
  - macOS: `userData`. The exec dir is inside the `.app` bundle.
  - Other Linux: the exec dir if writable, else `userData`.

## Migration

On Windows-installed and macOS, `models/` and `runtimes/` found next to the
executable are renamed into the new base on first launch. A destination that
already exists is never overwritten. If the `models` rename fails (for example a
custom install dir on another volume, where rename cannot cross devices and
copying ~100GB at startup is not acceptable), the legacy exec-dir base is kept
for that machine instead of silently orphaning the files.

The migration is recorded even when nothing was moved, so `main.js` can remap
absolute paths persisted by older versions (`SettingsDatabase.replacePathPrefix`)
either way.
