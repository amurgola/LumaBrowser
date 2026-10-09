# LlmRemotePane

`core/shell/ui/wizard/llm/LlmRemotePane.js` (ES module)

The remote provider form: endpoint, API key, and a model list fetched from the provider.

## Methods

- `new LlmRemotePane(wizard, step)`, `render(pane)`. Fetch models calls
  `ipcBridge.fetchModelsForEndpoint(type, endpoint, apiKey || null)`; the
  first model becomes the default.

## Globals

Reads `window.ipcBridge.fetchModelsForEndpoint`.
