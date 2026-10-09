# ManifestScanner

`core/shell/extensions/ManifestScanner.js`

Finds every directory containing a `manifest.js` under the extension roots.

## Methods

- `new ManifestScanner({ roots: [{ dir, userInstalled }], skipDebugOnly, onError(extensionId, phase, message) })`.
- `scan()` -> Map id -> manifest, each stamped `_dir` and `_userInstalled`.
  Roots are scanned in order and the first id wins, so bundled shadows
  sideloaded. A manifest with a FATAL issue is skipped; every issue is reported
  as phase `validation`. A manifest that throws is reported as `discovery`.
  `debugOnly` manifests are skipped when `skipDebugOnly`.
- `ManifestScanner.MANIFEST_FILE` is `manifest.js`.
