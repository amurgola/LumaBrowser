# ChatModelList

`core/llm-server/chat/router/ChatModelList.js`

The chat's model picker list and default selection.

## Methods

- `new ChatModelList({ llmServerService, db })`.
- `list()`: `{ models, defaultRef }`. The local row (`ref`, `label` "Local, middle dot, name", `displayName`, `providerId: 'local'`, `providerType: 'openai'`, `isLocal`, `runtimeId`, `ready`, `serverState`) when `computeLocalProviderEntry()` returns one; then each remote config with an endpoint and not `managedByCore`, one row per distinct model id (its `models`, else `selectedModel`). The default is the last-used ref while it exists, else the first row.
- `resolveRef(ref)`: the given ref, else `getLastModelRef()`, else the list default, else null.

## Why

The computed local entry is skipped so the local model is listed once.
