# LocalProviderEntry

`core/llm-server/service/LocalProviderEntry.js`

The computed LLM-providers row that represents the local server.

## Methods

- `LocalProviderEntry.compute({ defaults, port, resolveDisplayName, installed = [] })` null
  until both `runtimeId` and `modelPath` are set; else
  `{ id: 'core.llmServer.local', name: 'Local · <display>', displayName, type: 'openai', endpoint: 'http://127.0.0.1:<port or 8080>', apiKey: '', selectedModel: <stem>, models, managedByCore: true, managedBy: 'core.llmServer', managedRuntimeId }`.
  `installed` is `[{ stem, display }]` from [InstalledChatModels](InstalledChatModels.md);
  `models` is every installed model as `{ id: <stem>, luma_label: 'Local · <display>' }`, the
  default first (listed even when `installed` does not know it yet). The default's label
  is the installed list's name for it when there is one, which tells two files of one
  model apart; `name` and `displayName` stay the plain display name.
- `LocalProviderEntry.queueKey(entry)` `'<id>::<selectedModel>'`, null without a model.
- Statics: `ID`, `MANAGED_BY`, `FALLBACK_PORT` (8080), `LABEL_PREFIX` (`'Local · '`).

## Why

The row is never persisted: `core.llm.getProviderConfigs` injects it on read and
the save handler strips it, so it always shows the live port (8080-8099) and the
user cannot drop or stale it. The stem is the stable id (what llama-server
echoes, the queue key, the `local::` ref); the display name is only the label.
llama-server and its kin expose the OpenAI-compatible endpoint, hence `openai`.
Every installed model is listed so a picker can bind a slot to any of them; the
`luma_label` matches the labels a paired host's models carry.
