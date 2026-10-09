# CoreRequire

`extensions/ninfer-runtime/CoreRequire.js`

Loads a LumaBrowser core module from this add-on wherever it is installed.

## Methods

- `CoreRequire.load(relFromCoreRoot)` requires `<repo>/core/<rel>` relative to
  this file (dev, bundled). Only on `MODULE_NOT_FOUND` does it fall back to
  `<app.getAppPath()>/core/<rel>`; any other load error is rethrown.

## Why

A distributable add-on is sideloaded into the writable userData extensions dir,
where `../../core/...` points at nothing. `app.getAppPath()` is the app.asar
path in packaged builds (core ships as bytecode there; bytenode is registered
process-wide) and the project root in dev. Paths are rebuild class files, for
example `music-server/runtimes/Wsl`.
