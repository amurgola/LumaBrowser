# SettingsScreens

`core/shell/ui/settings/SettingsScreens.js` (ES module)

Wires the Settings Extensions and About tabs together once Settings exists: tabs, list, row, configuration, file actions, add-ons, Chrome extensions, footer action bar, About and License, and the pages extensions register (hidden under Extensions, or as a top-level tab of their own).

## Methods

- `new SettingsScreens({ meta, settingsEntries, host, hooks })`, `init()`,
  `switchTab(tabName)`, `refreshListIfVisible()`, `loadTelemetry()`.
- `registerPage(extensionId, content, config)`: `config.placement === 'tab'`
  gives the page a top-level tab named `config.tabId` (else `ext-<id>`) through
  [SettingsTabs](SettingsTabs.md)`.addExtensionTab` and mounts it visibly
  there (a re-register replaces the page); anything else, or no tab strip,
  mounts it hidden under Extensions for Configure. Switching to an extension's
  tab runs its `onActivate`.
- `unregisterPage(extensionId)`: the page and, when it owned one, the tab.
- `tabOf(extensionId)`: the tab name an extension's page owns, or null.
- The footer (`#settingsFooter`) is the Extensions action bar on that tab and
  empty elsewhere (everything autosaves).
- Subtabs load lazily: the list for Extensions and Inactive, the Chrome panel,
  About (only when `window.electronAPI.getLicenses` exists), License.

## Globals

Reads `window.electronAPI`.
