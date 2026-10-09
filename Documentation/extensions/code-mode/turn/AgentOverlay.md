# AgentOverlay

`extensions/code-mode/turn/AgentOverlay.js`

The stored agent a project conversation runs AS (`luma <agent>`), from
agent-manager's published `global.__lumaAgentManager.buildTurn(agentId)`.

## Methods (static)

- `resolve(data, agentManager = global.__lumaAgentManager)` -> null without
  `data.agentId`; `{ persona, allowedTools, kbScope, modelRef, missing: false }`
  for a live agent; `{ ..., missing: true }` when the agent is gone, the manager
  is absent or `buildTurn` throws.
- `personaOf(overlay)`: the persona, or `MISSING_PERSONA` ("... continue as the
  plain Code agent and mention that once.") for a missing agent.
- `mergeAllowedTools(allowedTools, overlay)`: the union, deduplicated; a null
  pin (plain chat) stays null.
- `turnFields(overlay)`: `{ kbScope?, modelRef? }` of a live agent, else `{}`.
