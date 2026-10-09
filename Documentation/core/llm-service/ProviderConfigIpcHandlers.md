# ProviderConfigIpcHandlers

`core/llm-service/ProviderConfigIpcHandlers.js`

IPC controller for the multi-provider settings list.

## Methods

- `new ProviderConfigIpcHandlers({ db, lmStudioService, anthropicService, llmServerService = null }).register()`:
  - `core.llm.getProviderConfigs` -> raw array, `ProviderConfigService.listProviderConfigs()`
  - `core.llm.saveProviderConfigs(configs)` -> envelope, `saveProviderConfigs(configs)`
  - `core.llm.fetchModelsForEndpoint(type, endpoint, apiKey)` -> envelope,
    `probeModelsForType(...)` (never saves)

A controller: logic lives in [ProviderConfigService](ProviderConfigService.md).
