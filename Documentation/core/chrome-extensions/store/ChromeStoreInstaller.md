# ChromeStoreInstaller

`core/chrome-extensions/store/ChromeStoreInstaller.js`

Installs or updates a Chrome Web Store extension.

## Methods

- `new ChromeStoreInstaller({ service, client, extractZip, tmpDir })`:
  `service` is [ChromeExtensionService](../ChromeExtensionService.md); the rest
  default to a real [ChromeWebStoreClient](ChromeWebStoreClient.md),
  `extract-zip` and `os.tmpdir()`.
- `install(idOrUrl)`: resolves the id, downloads and parses the `.crx`
  ([CrxArchive](CrxArchive.md)), refuses a package whose key yields another id,
  unpacks into a temp folder, runs `prepareFolder`, and calls
  `service.installFromStorePackage(folder, id)`. The temp folder is always
  removed. Returns the service's DTO.
- `checkForUpdate(id)`: `{ id, installedVersion, latestVersion, updateAvailable }`;
  throws for an extension that is not installed.
- `ChromeStoreInstaller.prepareFolder(dir, publicKey)`: deletes `_metadata` and
  writes the key into `manifest.json` as base64.
- `ChromeStoreInstaller.compareVersions(a, b)`: -1, 0 or 1 over dot-separated
  integers (missing parts are 0).

## Why

- Chrome refuses to load an unpacked folder holding a name that starts with
  `_` it does not own; `_metadata` (the store's signature data) is one, and is
  meaningless outside Chrome.
- Without `key`, Electron derives the id from the folder path, so every update
  would be a new extension with empty storage (a logged-out Bitwarden). With the
  key, the id is the store id, stable across updates and matching what sites
  that talk to the extension expect.
