# ExtensionsActionBar

`core/shell/ui/settings/ExtensionsActionBar.js` (ES module)

The Settings footer on the Extensions tab: Browse Add-ons, New Extension, Install from .zip, preceded by actions extensions contribute.

## Methods

- `new ExtensionsActionBar({ meta, hooks, onBrowseAddons, onNewExtension, onInstallZip })`.
- `render()`: checks the LLM gate (`core.llmServer.getDefaults` has `runtimeId`
  and `modelPath`), gives up if the Extensions section is no longer active,
  then renders. Contributed actions (`extensionsActions`, else
  `extensionsAction`) of enabled extensions, in load order, with gate `'llm'`,
  none, `true` or `'always'`.
- `run(action)`: optional [ActionPromptModal](ActionPromptModal.md), then
  `core.llmServer.startModeIntent({ mode: action.modeIntent, data })`; success
  hides Settings, failure toasts.
- `ExtensionsActionBar.clear()`.

## Globals

Reads `window.ipcBridge.invoke`.
