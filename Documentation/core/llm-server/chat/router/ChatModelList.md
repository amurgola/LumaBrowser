# ChatModelList

`core/llm-server/chat/router/ChatModelList.js`

The chat's model picker list (each model followed by its model profiles) and default selection.

## Methods

- `new ChatModelList({ llmServerService, db })`. The service may also offer `modelSettings` ([ModelSettings](../../service/ModelSettings.md)) and `resolveModelDisplayName(stem)`.
- `list()`: `{ models, defaultRef }`. The local row (`ref`, `label` "Local, middle dot, name", `displayName`, `providerId: 'local'`, `providerType: 'openai'`, `isLocal`, `runtimeId`, `ready`, `serverState`) when `computeLocalProviderEntry()` returns one; then each remote config with an endpoint and not `managedByCore`, one row per distinct model id (its `models`, else `selectedModel`). The default is the last-used ref while it exists, else the row the Settings "Default LLM" (`llm.provider`) points at (the local row for `core.llmServer.local`; for a provider type, its first config with an endpoint and `selectedModel`, at that model; for a stored config id such as a paired peer, its `selectedModel` or first model), else the first row.
- Profiles: each profile row follows its base model's row: the base row's fields plus `ref: 'profile::<id>'`, `label` "base label, middle dot, profile name", `isProfile: true`, `profileId`, `profileName`, `baseRef`. A profile of an installed local model that is not the current one is appended at the end (label from `resolveModelDisplayName`, `ready: false`); a remote profile whose base model is no longer listed is left out. A remembered profile is the default while it is listed.
- `resolveRef(ref)`: the given ref, else `getLastModelRef()`, else the list default, else null.

## Why

The computed local entry is skipped so the local model is listed once. The local row is always first, so without the "Default LLM" fallback a user who set a remote provider (Ollama through OpenAI-Compatible, say) as the default still got the local model in the chat and in the page chat (Luma On Demand reads this default).

Only the current local model has a row, but picking a profile of another installed local model switches the server just as picking that model in the picker does, so it stays selectable (and choosable for an agent).
