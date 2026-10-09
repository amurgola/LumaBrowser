# ExtensionFolderResolver

`core/shell/extension-admin/ExtensionFolderResolver.js`

Turns an extension id into its folder for the code editor from the main
process's own records. Never takes a path from the renderer.

## Methods

- `new ExtensionFolderResolver(extensionManager)`: reads `manifests`
  (id -> manifest stamped with `_dir` by ManifestScanner), `extensionsDir` and
  `userExtensionsDir`.
- `resolve(extensionId)`: the folder's real path (symlinks followed), or `null`.
  1. A discovered manifest's `_dir` (bundled or user-installed).
  2. Else, for an extension created from the template since startup (not
     discovered until restart), a folder named `<id>` directly inside the
     bundled, then the user extensions folder
     ([ContainedPath](../../shared/fs/ContainedPath.md)`.isImmediateChild`) that
     holds a `manifest.js` file.
  `null` for a non-string or empty id, a path-like id (`..`, `a/b`, absolute),
  a folder without `manifest.js`, or a folder that no longer exists.
