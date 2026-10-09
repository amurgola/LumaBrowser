# CoreRequire

`extensions/roleplay-mode/CoreRequire.js`

Resolves a LumaBrowser core module from roleplay-mode wherever the extension is
installed: next to `core/` when bundled, or the running app's root when the
add-on is sideloaded (`distributable: true`), where a relative require finds no
`core/`.

## Methods

- `CoreRequire.require(relFromCoreRoot)` e.g. `'roleplay-lab/LabHarness'`.
  Tries `<ext>/../../core/<rel>`; only on `MODULE_NOT_FOUND` falls back to
  `app.getAppPath()/core/<rel>`. Any other load error surfaces.
