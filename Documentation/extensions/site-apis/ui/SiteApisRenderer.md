# SiteApisRenderer

`extensions/site-apis/ui/SiteApisRenderer.js`

The Site APIs renderer: the settings page and the tab context-menu item.

## Methods

- `activate(context)`: `context` is the shell's `{ ipcBridge, slotManager, containers }`. Builds a
  [SettingsPage](SettingsPage.md) over `containers.settingsContainer`, registers the `settings-tab` `onActivate`
  callback (reload on open), subscribes to `ext.site-apis.changed` (bursts coalesce into one reload after 150 ms),
  registers a tab menu contributor, then loads the sites. A second activate tears the first down.
- `deactivate()`: clears the timer, unsubscribes, unregisters the menu item.
- `load()`: `listSites` into the page.
- `openBuilder({ tabId } or { siteId })`: invokes `ext.site-apis.openBuilder`; on success closes the Settings
  modal when the chat tab was opened (`opened`), else tells the user the conversation waits in the chat tab; a
  failure is a `Dialogs.alert`.
- `contributeMenu({ tab, tabId, add })`: adds `ext-sapi-create` "Create Site API from this tab" for tabs with
  `keepAlive` (persisted) only, calling `openBuilder({ tabId })`.

## Globals

`window.registerTabMenuContributor` (shell), `#settingsModal`.
