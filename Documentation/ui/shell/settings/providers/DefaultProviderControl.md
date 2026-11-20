# DefaultProviderControl

`ui/shell/settings/providers/DefaultProviderControl.js`

The Defaults control: default LLM provider and default image generation / editor / video generation servers, each with the model it runs (a shared server's model, or a local slot's model via `imageServersAPI.setLocalServerModel(field, modelId)`, the same image default Setup's Image page edits). Each is a standard settings row (`.provider-default-row.gs-row`): label and help on the left, the select right-aligned; the model row is nested under its server.

## Methods

- `render(listEl, { configs, activeKey, imageCfg })`.
- `DefaultProviderControl.html(options, activeKey, imageCfg)`.

## Globals

Reads `window.electronAPI.saveLlmProviderConfig`, `window.imageServersAPI`.
