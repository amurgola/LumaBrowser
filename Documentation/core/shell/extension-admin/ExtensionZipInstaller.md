# ExtensionZipInstaller

`core/shell/extension-admin/ExtensionZipInstaller.js`

Installs an extension from a .zip, for the "Install from .zip" dialog and the
add-on downloader alike.

## Methods

- `new ExtensionZipInstaller({ extensionManager, rootDir, extractZip?, tmpDir?, log? })`.
- `install(zipPath)` never throws:
  1. extracts into `<tmpDir>/luma-ext-<time>`;
  2. finds `manifest.js` at the archive root or inside the single wrapper folder
     (`No manifest.js found in archive`), requires it (dropped from the require
     cache at once) and needs `id` and `name` (`Invalid manifest: missing id or name`);
  3. moves the folder to `<userExtensionsDir>/<id>` (or `<rootDir>/extensions/<id>`),
     replacing an earlier install; across volumes (`EXDEV`) it copies instead;
  4. hot-activates it with `extensionManager.hotInstallExtension(dir)`.
  Resolves `{ success: true, extensionId, name, dir, activated, activationError }`;
  a failed activation still installs (discover() picks it up on next launch) and
  logs a warning. Any failure resolves `{ success: false, error }`. The temp dir is
  always removed.

The bundled extensions dir is inside the read-only asar in packaged builds, so
sideloaded add-ons go to the userData location ExtensionManager also scans.
