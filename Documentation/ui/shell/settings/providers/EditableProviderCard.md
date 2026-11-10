# EditableProviderCard

`ui/shell/settings/providers/EditableProviderCard.js`

Card of a user-added provider: endpoint, key, model with Fetch models, Save, Remove.

## Methods

- `EditableProviderCard.build(config, ctx)`, `html(config)`, `parts(config)` (for [ProviderCardShell](ProviderCardShell.md)), `isConfigured(config)`, `statusText(config)`, `modelOptions(models, selected)`.

## Globals

Reads `window.ipcBridge.invoke('core.llm.fetchModelsForEndpoint')`.
