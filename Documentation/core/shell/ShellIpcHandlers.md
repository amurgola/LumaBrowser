# ShellIpcHandlers

`core/shell/ShellIpcHandlers.js`

IPC controller for `core.shell.*`: extension management, the add-on catalog,
the extension code editor, external links, the settings modal and the About
licenses. It routes only; the work is in `core/shell/extension-admin/`. Replies
are raw values (not enveloped), the shapes the renderer has always read.

## Methods

- `new ShellIpcHandlers({ extensionManager, mainWindowGetter, rootDir, identity?, waitForExtensions? })`.
  `identity` is the [MachineIdentity](../install/MachineIdentity.md) that signs
  add-on catalog requests; `waitForExtensions()` resolves when main-side
  extension activation has finished.
- `register()` registers the channels below.

## Channels

| Channel | Routes to |
|---|---|
| `core.shell.getExtensions` | waits for `waitForExtensions()`, then `extensionManager.getRendererExtensionList()` |
| `core.shell.getExtensionErrors` | `extensionManager.getErrors()` |
| `core.shell.toggleExtension(id, enabled)` | `enableExtension(id)` / `disableExtension(id)` |
| `core.shell.getToggleConstraints` | `extensionManager.getToggleConstraints()` |
| `core.shell.deleteExtension(id)` | `extensionManager.deleteExtension(id)` (bundled and `deletable: false` refused there) |
| `core.shell.getExtensionRendererSource(id)` | `extensionManager.getRendererSource(id)` |
| `core.shell.installExtension(filePath)` | [ExtensionZipInstaller](extension-admin/ExtensionZipInstaller.md).install |
| `core.shell.openExtensionFileDialog` | open dialog for a .zip: `{ canceled, filePath? }` |
| `core.shell.exportExtension(id, extDir)` | [ExtensionExporter](extension-admin/ExtensionExporter.md) with a save dialog |
| `core.shell.getAvailableAddons` | [AddonCatalog](extension-admin/AddonCatalog.md).list |
| `core.shell.downloadAndInstallAddon(id)` | AddonCatalog.downloadAndInstall |
| `core.shell.listExtensionFiles()`, `readExtensionFile(name)`, `writeExtensionFile(name, content)` | editor window only: [ExtensionSourceFiles](extension-admin/ExtensionSourceFiles.md) on the sender's folder from [ExtensionEditorWindows](extension-admin/ExtensionEditorWindows.md)`.sessionOf`; any other sender throws |
| `core.shell.openExtensionEditor(ignoredDir, extId)` | ExtensionEditorWindows.open(extId): the folder comes from [ExtensionFolderResolver](extension-admin/ExtensionFolderResolver.md), the first argument is ignored; `{ success: false, error }` for an unknown id |
| `core.shell.createExtensionTemplate(name)` | [ExtensionTemplate](extension-admin/ExtensionTemplate.md).create |
| `core.shell.getExtensionAutocompleteData()` | editor window only: [ExtensionEditorHints](extension-admin/ExtensionEditorHints.md).build for the sender's extension id (a renderer-supplied id is ignored) |
| `core.shell.openExternal(url)` | `shell.openExternal` after [ExternalUrl](extension-admin/ExternalUrl.md).refusal |
| `core.shell.openSettings(tab)` | `tab-view:accelerator` `{ action: 'open-settings', settingsTab }` to the main window; a tab name not matching `[a-z0-9-]{1,40}` becomes `general` |
| `core.shell.getLicenses` | [AppLicenseInfo](extension-admin/AppLicenseInfo.md).read |
