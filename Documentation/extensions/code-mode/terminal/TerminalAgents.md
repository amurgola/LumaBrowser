# TerminalAgents

`extensions/code-mode/terminal/TerminalAgents.js`

The stored agents as the terminal sees them, through agent-manager's published
`{ listAgents, buildTurn }`.

## Methods (static)

- `resolve(agentManager, nameOrId)` -> the agent by id, else by name
  (case-insensitive, trimmed), else null.
- `turnOf(agentManager, agentId)` -> its per-turn config or null (also on throw).
- `listing(agentManager, router)` -> `{ agents: [{ id, name, description, model, tools, kbDocs }], defaultModel }`
  (`model` is the agent's pin or the default; `tools` the grant count).
- `defaultModel(router)` -> `router.listModels().defaultRef` or null.
