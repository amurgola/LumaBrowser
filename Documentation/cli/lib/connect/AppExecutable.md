# AppExecutable

`cli/lib/connect/AppExecutable.js`

Finds the LumaBrowser executable to start when the app is not running.

## Methods (static)

- `AppExecutable.resolve({ env?, proc?, exists?, readRecord? })` returns the first that exists:
  1. `$LUMA_APP_EXE`;
  2. under Electron (the app's own `luma` launcher), `$APPIMAGE`, then `process.execPath`;
  3. the `executable` of the npm launcher's [InstallRecord](InstallRecord.md);

  else `null`. The options are test seams.

## Why

Under the launcher the app installs, this process is the app binary in Node mode, so it is the right
version by construction. On an AppImage, `execPath` is the mounted copy that vanishes on exit, so
`$APPIMAGE` (the file itself) comes first.
