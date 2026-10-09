# AgentStore

`extensions/agent-manager/AgentStore.js`

Persists custom sub-agents as one JSON list under `agentManager.agents`.
Extends [JsonCollectionStore](../../core/database/JsonCollectionStore.md).

## Methods

- `new AgentStore(rawDb)`; `AgentStore.STORAGE_KEY`.
- `get(idOrName)`: by id, else case-insensitively by trimmed name; null otherwise.
- `create({ name, description?, systemPrompt?, tools?, modelRef? })`: name
  required and unique (`Agent name is required`, `An agent named "<n>" already exists`);
  id `<slug>-<6 chars>`; non-string tools dropped; `modelRef` null means the app default.
- `update(id, patch)`: `Agent not found`; renames are trimmed, non-empty and
  unique; `'modelRef' in patch` (even null) resets the pin; bumps `updatedAt`.
- `list()`, `delete(id)` from the base.
