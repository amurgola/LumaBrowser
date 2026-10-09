# AgentSseChat

`extensions/agent-manager/AgentSseChat.js`

`POST /api/ext/agent-manager/agents/:id/chat` for API clients.

## Methods

- `new AgentSseChat(runTurn)` (the extension API's `runTurn`).
- `respond(agent, body, req, res)`: `{ message | prompt, images?, stream? }`;
  400 `message is required`. With `stream: false`: 500 `{ success: false, error }`
  or `{ success, agent, response, artifacts }`. Otherwise Server-Sent Events:
  `agent.start`, `agent.reasoning`, `agent.delta`, `agent.tool`,
  `agent.artifact` (metadata via [ArtifactSummary](ArtifactSummary.md)), then
  `agent.done { response, artifacts }` or `agent.error`, and `[DONE]`. A client
  disconnect aborts the run.
