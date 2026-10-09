# AgentMcpTools

`extensions/agent-manager/AgentMcpTools.js`

`list_agents` and `chat_with_agent` for the in-app chat agent and external MCP clients.

## Methods

- `AgentMcpTools.TOOLS` (definitions, same text as legacy without em-dashes).
- `new AgentMcpTools({ store, runtime, knowledge })`; `setStore(store)`.
- `handle(toolName, args, opts)` -> an MCP result (`{ content: [{ type: 'text', text: JSON }] }`, `isError` on failure):
  - `list_agents` -> `{ success, agents: [{ name, description, knowledgeBaseDocs? }] }`.
  - `chat_with_agent { agentName|agent|name, message|prompt|task, images? }`:
    validates both, looks the agent up by name or id, then runs it on
    [AgentRuntime](AgentRuntime.md). `opts.emit` receives `start`, the sub-agent's
    stream tagged with one `invocationId`, and `done`/`error`; artifacts go to an
    [ArtifactBubbler](ArtifactBubbler.md) on `opts.chat` instead of the card.
    Result `{ success, agent, response, artifacts?, note? }` (artifacts collapsed
    to the latest version per chain, with a note that they are already shown).
  - anything else: `Unknown tool: <name>`.
