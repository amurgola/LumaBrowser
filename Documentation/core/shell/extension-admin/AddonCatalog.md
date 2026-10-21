# AddonCatalog

`core/shell/extension-admin/AddonCatalog.js`

The optional add-on catalog on lumabyte.com as the Extensions tab sees it.

## Methods

- `new AddonCatalog({ client, installer, extensionManager, tmpDir? })`; `client` is
  an [AddonClient](../AddonClient.md), `installer` an [ExtensionZipInstaller](ExtensionZipInstaller.md).
- `list()` the client's reply with each entry's `installed`: discovered by the
  ExtensionManager (bundled or active), or present in the user extensions dir from
  an earlier install that still needs a restart.
- `downloadAndInstall(addonId)` downloads (`Download failed` when the client gives
  no reason), writes `<tmpDir>/luma-addon-<safe id>-<time>.zip`, installs it, and
  always removes the zip. Resolves the installer's result or `{ success: false, error }`.

## installedVersion

`list()` also sets `installedVersion` on each entry from the running
manifest (`manifests.get(id).version`), or `null`. Browse Extensions uses it
to offer Update only when the catalog has a newer version.
