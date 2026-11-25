# WizardAddons

`core/shell/ui/wizard/WizardAddons.js` (ES module)

The add-ons the first-run wizard can switch on before they are installed. Since most extensions are
`distributable: true`, a fresh install has only the core ones in app.asar; the presets (Chat: Timed Tasks;
Create: Roleplay, Game; Agent toolkit: Selenium; Notification Gateway and Full Studio: Page Change Detector,
Hub) and the Custom features list name add-ons that have to be downloaded from the catalog first.

## Methods

- `new WizardAddons({ invoke? })`: `invoke(channel, ...args)` defaults to the shell's IPC.
- `load()`: `core.shell.getAvailableAddons` ([AddonCatalog](../../extension-admin/AddonCatalog.md));
  keeps entries that are neither installed nor private. Never throws; offline or refused, nothing is offered.
- `entries()`, `find(id)`, `nameOf(id)` (catalog name, else the id).
- `pending(enabledIds, installedIds)`: the enabled ids not installed. Once the catalog answered, only the
  ones it offers; without it every one, so the download reports why it failed.
- `install(ids, onProgress?)`: `core.shell.downloadAndInstallAddon` per id, `onProgress({ id, name, index,
  total })` before each. An install whose activation was refused with "Requires extension ..." (another
  add-on in the list has to be active first) is retried after the others; when a round makes no progress
  the rest fail. "Installed but not activated" counts as a failure. Resolves `{ installed: [id], failed:
  [{ id, name, error }] }`.

## Used by

[SetupWizard](SetupWizard.md) (`addons`, `pendingAddons()`, `extensionName()`),
[FeaturesStep](steps/FeaturesStep.md) (the add-on rows) and [WizardFinisher](WizardFinisher.md) (the
install on Finish, after `setSetupComplete` activated the extensions).
