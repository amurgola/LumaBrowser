# LocalApiUpstream

`core/llm-server/server/LocalApiUpstream.js`

What the localhost API ([LocalApiServer](LocalApiServer.md)) sees of the running
chat model. Reads live LLM service state on every call and never starts a model.

## Methods

- `new LocalApiUpstream(llmServerService)`; every service member is optional
  (`runtimeServer`, `getDefaults`, `getApiKeyForLaunch`, `listInstalledChatModels`,
  `getRunningThinking`) and anything missing or throwing reads as nothing loaded.
- `current()` `{ baseUrl, apiKey, modelId }` only for a `ready` server with a port:
  - `baseUrl` from `runtimeServer.baseUrl()` (a WSL child can move hosts), else loopback;
  - `apiKey` the launch key when `getApiKeyForLaunch().required`, else null;
  - `modelId` the file stem of `status.modelPath`, else `plan.modelPath`, else
    the default model, else `'local'`.
- `hostDial()` `'off'` when the defaults say `noThink`, else `reasoningEffort` or null.
- `getThinking()` `getRunningThinking()` when the service has it, else null.
- `listModels()` installed stems as `{ id }` (the disk scan cached for
  `MODELS_CACHE_MS`, 15 s; a failing scan is empty) with the loaded model first
  as `{ id, current: true }` and not repeated.
