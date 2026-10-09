# LlmIpcDeps

`core/llm-server/ipc/LlmIpcDeps.js`

The optional collaborators main.js hands [LlmServerIpcHandlers](../LlmServerIpcHandlers.md),
plus the lazy lookups several services share.

## Methods

- `new LlmIpcDeps(deps)`; `deps` may be null.
- `get(name)` the collaborator, or null when this boot did not provide it.
- `agentDeps()` `deps.getAgentDeps()` read on every call (the browser and
  extensions arrive after boot), or null.
- `artifactStore()` the agent deps' `artifactStore`, or null.
- `imageServerService()` `deps.imageServerService`, else `global.__lumaImageServerService`, else null.
- `emit(emitterName, type, payload)` calls `deps[emitterName](type, payload || {})`
  when it is a function; a throw is swallowed (notifications are advisory).
