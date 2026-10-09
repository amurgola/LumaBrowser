# ExtensionSettingsRegistry

`core/shell/ui/settings/ExtensionSettingsRegistry.js` (ES module)

Holds each extension's settings page: mounted hidden in the Extensions pane until Configure shows it, or visibly in the section of the top-level tab the extension asked for.

## Methods

- `setContainer(el)`; `register(extensionId, content, { label?, onActivate? })`
  returns the `.ext-settings-content` element (null and a warning before
  Settings exists); `get(id)` -> `{ label, element, onActivate, config, tab? }`
  or null; `delete(id)`; `setCallback(id, name, fn)`.
- `registerInSection(extensionId, content, config, section, tab)`: the page
  mounted visibly in its own tab's section, replacing a previous page.
- `byTab(tabName)`: the entry owning that tab; `remove(id)`: drops the page
  element and the entry.

## Globals

None.
