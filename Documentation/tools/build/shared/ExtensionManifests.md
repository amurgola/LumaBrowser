# ExtensionManifests

`tools/build/shared/ExtensionManifests.js`

Loads every `<root>/extensions/<dir>/manifest.js` (fresh, not from the require
cache) for the build tools. A manifest that throws is skipped with a log line.
Used by [AddonPackager](../addons/AddonPackager.md),
[DistributableExtensionPruner](../pack/DistributableExtensionPruner.md) and
[AsarLayoutVerifier](../verify/AsarLayoutVerifier.md).

## Methods

- `list()`: `[{ dir, manifest }]`.
- `distributableDirs()`: the set of folder names whose manifest has
  `distributable: true`.
