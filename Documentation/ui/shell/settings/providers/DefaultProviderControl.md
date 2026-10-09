# DefaultProviderControl

`ui/shell/settings/providers/DefaultProviderControl.js`

The Defaults control: default LLM provider and default image generation / editor servers (plus a shared server's model).

## Methods

- `render(listEl, { configs, activeKey, imageCfg })`.
- `DefaultProviderControl.html(options, activeKey, imageCfg)`.

## Globals

Reads `window.electronAPI.saveLlmProviderConfig`, `window.imageServersAPI`.
