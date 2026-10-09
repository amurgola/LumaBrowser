# ExtensionManifests

`tools/build/bytecode/ExtensionManifests.js`

Loads every `<root>/extensions/<dir>/manifest.js` (fresh, not from the require
cache) for the build tools. A manifest that throws is skipped with a log line.

## Methods

- `list()`: `[{ dir, manifest }]`.
- `privateDirs()`, `distributableDirs()`: sets of folder names.
- `browserFiles()`: root-relative scripts the manifests serve to pages.
- `ExtensionManifests.browserScripts(manifest)`: extension-relative paths of
  `renderer`, `chatUi.file` and its `.js` assets, `setupTab.file` and its `.js`
  assets, `chatModes[].chatUi` and `browserScripts`.
