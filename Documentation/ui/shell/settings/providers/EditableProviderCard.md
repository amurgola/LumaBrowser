# EditableProviderCard

`ui/shell/settings/providers/EditableProviderCard.js`

Card of a user-added provider: endpoint, key, model with Fetch models, Save, Remove.

## Methods

- `EditableProviderCard.build(config, ctx)`, `html(config)`, `statusText(config)`, `modelOptions(models, selected)`.

## Globals

Reads `window.ipcBridge.invoke('core.llm.fetchModelsForEndpoint')`.
