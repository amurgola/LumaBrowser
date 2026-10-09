# LlmLocalRunner

`core/shell/ui/wizard/llm/LlmLocalRunner.js` (ES module)

Runs the local LLM installs through LlmSetup (download) and ImportSetup (adopt), locking navigation while busy.

## Methods

- `runSetup()`: `LlmSetup.run(WizardApis.llm(), { rec, advanced, ... })`.
- `runImport(found)`: `ImportSetup.run(WizardApis.llmImport(), { found,
  runtimeId, contextSize, kvCacheType, ... })` with `importRecommendation()`.
- `importRecommendation()`: `core.llmServer.recommendModel({})` once ->
  `{ runtimeId, contextSize, kvCacheType }` (nulls when unavailable).
- Success enables the pinned LLM tab (`core.llmServer.setEnabled(true)`) and sets
  the model name to the file name without its extension (the slot model id).

## Globals

Reads `window.ipcBridge.invoke`.
