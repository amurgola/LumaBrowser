# EditableProviderCard

`ui/shell/settings/providers/EditableProviderCard.js`

Card of a user-added provider: endpoint, key, model with Fetch Models, Save, Remove.

## Methods

- `EditableProviderCard.build(config, ctx)`, `html(config)`, `statusText(config)`, `modelOptions(models, selected)`.

## Globals

Reads `window.ipcBridge.invoke('core.llm.fetchModelsForEndpoint')`.

The context-budget input applies to the selected model only. Blank means auto-detect; a positive safe integer supplies a fallback or smaller budget, never a backend configuration change. Budgets are saved in `config.contextWindows[modelId]`, survive model-list refresh, and are cleared when the endpoint changes. Switching the selected model displays its saved budget. Invalid values are rejected before saving.
