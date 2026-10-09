# TriggerActionConfig

`core/llm-server/chat/trigger-store/TriggerActionConfig.js`

Normalises a trigger's `action` for [TriggerStore](../TriggerStore.md).

## Methods

- `TriggerActionConfig.normalize(action)` returns `{ mode, prompt, expect?,
  artifactRootId?, agentId? }`: `prompt` trimmed (throws
  `a trigger needs a prompt`), `mode` `agent` unless `prompt`; `expect` only a
  non-empty plain object (matchers over the run's JSON result); trimmed
  `artifactRootId`; trimmed `agentId` only in agent mode (a configured agent
  replaces the trigger's own agent).
- `TriggerActionConfig.merge(current, patch)`: shallow merge where a patch
  `null` removes `expect`, `artifactRootId` or `agentId`.
- `TriggerActionConfig.MODES`: `['prompt', 'agent']`.
