# BuildFs

`tools/build/BuildFs.js`

Returns Electron's unpatched `original-fs` inside Electron (npm test runs Jest
under ELECTRON_RUN_AS_NODE) and plain `fs` otherwise. Electron's patched fs
treats every `app.asar` as a folder, which breaks code that creates, deletes and
inspects the archive file itself. `@electron/asar` does the same.

Even `original-fs.rmSync` stats through the patched fs (Node's internal rimraf),
which opens an archive into Electron's cache and pins it open, so archives are
deleted with `unlinkSync`.

## Methods

- `BuildFs.get()`
