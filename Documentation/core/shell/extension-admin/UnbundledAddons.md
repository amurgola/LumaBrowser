# UnbundledAddons

`core/shell/extension-admin/UnbundledAddons.js`

The extensions that stopped shipping inside the app and became catalog add-ons, by the release that made the
change. [AddonUpgradeMigration](AddonUpgradeMigration.md) reads it to bring them back after an upgrade.

## Methods

- `UnbundledAddons.RELEASES`: `[{ version, ids }]`, `version` being the first release without those ids in
  app.asar.
- `UnbundledAddons.between(previousVersion, currentVersion)`: the ids of every release after `previousVersion` up
  to and including `currentVersion` ([VersionCompare](../ide-installers/VersionCompare.md)), each once, in table
  order. A downgrade answers `[]`.

## Releases

- 2.2.8: cdp-driver, desktop-integration, game-mode, lora-trainer, ntfy-notifier, on-demand-mode,
  page-change-detector, personal-hub, selenium-driver, site-apis, timed-tasks, tool-forge. The debug-only
  ext-test-harness became distributable the same day and is left out: no user had it.

Add a row whenever a release marks more bundled extensions `distributable: true`
(the build's DistributableExtensionPruner then drops them from app.asar), or an upgrade loses them.
