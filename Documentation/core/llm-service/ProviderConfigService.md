# ProviderConfigService

`core/llm-service/ProviderConfigService.js`

The logic behind the LLM provider settings UI. Used by
[LlmIpcHandlers](LlmIpcHandlers.md) and [ProviderConfigIpcHandlers](ProviderConfigIpcHandlers.md).

## Methods

- `new ProviderConfigService({ db, lmStudioService, anthropicService, llmServerService = null })`.
- `getDefaultProvider()`: `llm.provider`, default `'none'`. A removed
  provider (`webgpu`) is rewritten to `'none'` and saved.
- `setDefaultProvider(provider)`: ignores `undefined`.
- `ProviderConfigService.applyProviderSettings(provider, config)` (static):
  applies only the fields present (`endpoint`, `selectedModel`, `apiKey`,
  `models`); models go through `setModels` so memory never drifts from disk.
- `probeModels(provider, endpoint, apiKey)`: `fetchModels()` under
  `withTemporaryConfig`, so a probe never saves (bug H15).
- `probeModelsForType(type, endpoint, apiKey)`: `'openai'` or `'anthropic'`,
  else `{ success: false, error: 'Unknown provider type' }`.
- `listProviderConfigs()`: stored `llm.providerConfigs` minus any
  `managedByCore` entry, plus the LLM Server's computed local entry.
- `saveProviderConfigs(configs)`: persists the user configs (managed entries
  stripped), syncs the first complete config (endpoint and model) of each
  type into the single-provider keys, and re-resolves the default.

## Default resolution

A default is kept when it still resolves: a type with a complete config, the
managed local server (`core.llmServer.local`), or the id of a stored config (a
paired Network Sharing peer). Otherwise it becomes `openai`, then `anthropic`,
then `none`. Saving an unrelated provider card must not steal "default".

## Why the local entry is never stored

It is computed on every read so a stale port can never be saved, and every
consumer of the list (slot routing, chat, extensions) sees the local
model as soon as the user picks defaults for it.
