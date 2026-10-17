# DefaultProviderControl

`ui/shell/settings/providers/DefaultProviderControl.js`

The Defaults control: default LLM provider and default image generation / editor servers (plus a shared server's model). Each is a standard settings row (`.provider-default-row.gs-row`): label and help on the left, the select right-aligned; the shared-server model row is nested under its server.

## Methods

- `render(listEl, { configs, activeKey, imageCfg })`.
- `DefaultProviderControl.html(options, activeKey, imageCfg)`.

## Globals

Reads `window.electronAPI.saveLlmProviderConfig`, `window.imageServersAPI`.
