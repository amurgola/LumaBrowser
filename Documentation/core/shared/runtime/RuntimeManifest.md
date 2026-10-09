# RuntimeManifest

`core/shared/runtime/RuntimeManifest.js`

The `manifest.json` in a managed runtime directory: written after an install,
read back by detection and the update check.

## Methods

- `RuntimeManifest.build({ entry, release, asset, sha256, companions, binaryPath, managedDir, prerelease })`
  returns `{ id, installedAt, release: { tag, url, publishedAt, channel, prerelease }, asset: { name, url, size, sha256 }, companions, binary }`.
  `channel` is `'prerelease'` or `'stable'`; `binary` is relative to `managedDir`.
- `RuntimeManifest.write(managedDir, manifest)` writes pretty JSON.
- `RuntimeManifest.read(managedDir)` resolves the parsed manifest, or `null`
  when missing or corrupt.
- `RuntimeManifest.pathIn(managedDir)`, `RuntimeManifest.FILE_NAME`.

## Why

The channel is recorded so the UI can badge a pre-release install and the
update check compares against the feed the user opted into. Reading and writing
live together so the installer and the detectors (including the music detector,
which reads the same file) agree on the shape.
