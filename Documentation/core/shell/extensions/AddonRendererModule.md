# AddonRendererModule

`core/shell/extensions/AddonRendererModule.js`

Where the shell loads an installed add-on's ES-module renderer from, and the import map that makes its
relative imports land where they would if the add-on were bundled.

## Methods

- `AddonRendererModule.describe(manifest, bundledDir, bundledFolders)` -> `{ url, imports }`:
  - `url`: the file URL of `manifest.renderer` inside `manifest._dir`;
  - `imports` (U is the user data dir as a file URL, A the app root): `U/` -> `A/` (so
    `../../../core/...` from the add-on reaches the app's core), `U/extensions/` -> itself (the add-on's
    own files and other installed add-ons), and `U/extensions/<bundled folder>/` -> `A/extensions/<folder>/`
    for each bundled extension (so `../../ui-kit/...` reaches the bundled ui-kit). The browser picks the
    longest matching prefix.

## Used by

[RendererExtensionList](RendererExtensionList.md) puts both on the row (`rendererUrl`,
`rendererImports`); the shell's [RendererScriptLoader](../ui/extensions/RendererScriptLoader.md) adds the
import map and loads the module.
