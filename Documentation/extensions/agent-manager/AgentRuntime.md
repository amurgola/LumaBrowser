# AgentRuntime

`extensions/agent-manager/AgentRuntime.js`

Runs a stored agent as a "micro-LLM" on a scoped AgentChatBridge run.

## Methods

- `new AgentRuntime({ getRouter = ExtensionGlobals.chatRouter, Bridge = null })`
  (`Bridge` defaults to core AgentChatBridge, required lazily per run).
- `runTurn({ agent, messages, images?, emit?, signal? })` -> `{ text, error, artifacts }`.
  Errors, never throws: `No agent supplied`, `LLM chat router is not available yet`,
  `No model is configured for this agent`, a failed start or rejected run.
  One fresh `bridge.run` with: the agent's model or the router default,
  `deps: router.getAgentDeps()`, temperature 0.4, a phantom `agent:<id>:<stamp>`
  conversation, the knowledge grant ([AgentKnowledgeGrant](AgentKnowledgeGrant.md):
  allow-list, persona plus KB note, `kbScope`), images, and
  [AgentRunSink](AgentRunSink.md) hooks. An AbortSignal-like `signal` aborts
  the run (already aborted or later).
