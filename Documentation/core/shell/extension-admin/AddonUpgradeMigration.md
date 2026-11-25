# AddonUpgradeMigration

`core/shell/extension-admin/AddonUpgradeMigration.js`

On launch after an upgrade, downloads and installs the add-ons the previous version had bundled and this one no
longer ships ([UnbundledAddons](UnbundledAddons.md)), so an upgrade never takes away an extension the user had.
Run by [HeavyServices](../../../app/ready/HeavyServices.md) once extensions are active, not awaited.

## Methods

- `new AddonUpgradeMigration({ settings, catalog, currentVersion, log? })`: `settings` has `get(key, fallback)` and
  `set(key, value)` (the settings db); `catalog` an [AddonCatalog](AddonCatalog.md) (`isInstalled`,
  `downloadAndInstall`).
- `AddonUpgradeMigration.forApp({ settings, extensionManager, identity, rootDir, currentVersion, log? })`: the same,
  with an AddonCatalog over an [AddonClient](../AddonClient.md) and an
  [ExtensionZipInstaller](ExtensionZipInstaller.md), the pieces Settings > Extensions installs with.
- `run()` resolves `{ previousVersion, installed, failed: [{ id, error }] }`:
  1. The previous version: `core.lastRunVersion` (`LAST_RUN_KEY`); without one, `UNRECORDED_VERSION` (2.2.7) when
     `core.setupComplete` is set (a profile from before versions were recorded), else `null` (a fresh install,
     nothing to bring back).
  2. The ids unbundled since then that `isInstalled` does not find (bundled, active, or in the user extensions dir).
  3. Each is downloaded and hot-installed in turn; a refusal or a throw is a failure, and the rest still install.
  4. With no failure, `core.lastRunVersion` becomes the running version. A failure leaves it, so the next launch
     tries again, and only for what is still missing.
  5. Logs `[addon-upgrade] <previous> -> <current>: installed <ids>` and one error line per failure.

## Why

2.2.8 made twelve extensions that were bundled until 2.2.7 into catalog add-ons, and the build drops those from
app.asar. Nothing on the user's disk held them, so an upgrade would have taken away the Hub, Timed Tasks, Page
Monitors and the others. Once the version is recorded the migration does not run again for it, so an add-on the
user removes later stays removed. An add-on the user had switched off comes back switched off: the disabled list is
kept by id.

To test against a catalog that is not on lumabyte.com, start the app with `LUMA_ADDON_BASE_URL` pointing at a
server that answers `/api/addons` and `/api/addons/<id>/download` with the zips of `npm run build:extensions`.
