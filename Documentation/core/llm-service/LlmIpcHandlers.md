# LlmIpcHandlers

`core/llm-service/LlmIpcHandlers.js`

IPC controller for the core LLM settings. Getters reply raw (arrays, records,
a meaningful `null`); anything that mutates or can fail is wrapped by
`IpcEnvelope.enveloped`, and handlers that build their own envelope pass through.

## Methods

- `new LlmIpcHandlers({ db, lmStudioService, anthropicService, llmService, getMainWindow }).register()`
  registers the channels and attaches [LlmQueueEventForwarder](LlmQueueEventForwarder.md).

## Channels

| Channel | Reply | Routes to |
|---|---|---|
| `save-llm-provider-config` `(config)` | envelope | `ProviderConfigService.setDefaultProvider(config.provider)` |
| `get-llm-provider-config` | raw `{ provider }` | `getDefaultProvider()` |
| `save-lmstudio-config`, `save-anthropic-config` `(config)` | envelope | `ProviderConfigService.applyProviderSettings` |
| `get-lmstudio-config`, `get-anthropic-config` | raw config | `provider.getConfig()` |
| `fetch-lmstudio-models`, `fetch-anthropic-models` `(endpoint)` | envelope | `probeModels` (never saves) |
| `test-lmstudio-connection`, `test-anthropic-connection` | envelope | `provider.testConnection()` |
| `core.llm.getAllSlots`, `getAllAvailableModels`, `getProviders` | raw arrays | LLMService |
| `core.llm.getSlotConfig` `(slotId)` | raw, may be `null` | LLMService |
| `core.llm.setSlotConfig` / `clearSlotConfig` | envelope | LLMService |
| `core.llm.sendCompletion` `(slotId, messages, options)` | its own envelope | LLMService |
| `core.llm.queue.getSnapshot` | raw array (`[]` without a queue) | LLMQueueManager |
| `core.llm.queue.setConcurrency` `(modelId, max)` | envelope; `Queue manager not initialized` refusal | LLMQueueManager |

A controller: no logic beyond the queue null guard.
