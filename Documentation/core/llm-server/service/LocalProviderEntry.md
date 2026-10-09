# LocalProviderEntry

`core/llm-server/service/LocalProviderEntry.js`

The computed LLM-providers row that represents the local server.

## Methods

- `LocalProviderEntry.compute({ defaults, port, resolveDisplayName })` null
  until both `runtimeId` and `modelPath` are set; else
  `{ id: 'core.llmServer.local', name: 'Local · <display>', displayName, type: 'openai', endpoint: 'http://127.0.0.1:<port or 8080>', apiKey: '', selectedModel: <stem>, models: [{ id: <stem> }], managedByCore: true, managedBy: 'core.llmServer', managedRuntimeId }`.
- `LocalProviderEntry.queueKey(entry)` `'<id>::<selectedModel>'`, null without a model.
- Statics: `ID`, `MANAGED_BY`, `FALLBACK_PORT` (8080).

## Why

The row is never persisted: `core.llm.getProviderConfigs` injects it on read and
the save handler strips it, so it always shows the live port (8080-8099) and the
user cannot drop or stale it. The stem is the stable id (what llama-server
echoes, the queue key, the `local::` ref); the display name is only the label.
llama-server and its kin expose the OpenAI-compatible endpoint, hence `openai`.
