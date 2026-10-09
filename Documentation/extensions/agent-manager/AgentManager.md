# AgentManager

`extensions/agent-manager/AgentManager.js`

The Agent Manager service: the agent store plus everything that changes with it.

## Methods

- `new AgentManager(context, { knowledge, runtime })`: `store` ([AgentStore](AgentStore.md)
  on `context.db.getRawDb()`), `knowledge` ([AgentKnowledgeBase](AgentKnowledgeBase.md)),
  `transfer` ([KnowledgeBaseTransfer](KnowledgeBaseTransfer.md)), `runtime`
  ([AgentRuntime](AgentRuntime.md)), `chatMode` ([AgentChatMode](AgentChatMode.md)
  over `context.chat`), `bundles` ([AgentBundle](AgentBundle.md)).
- `createAgent(input)` and `deleteAgent(id)` re-sync the chat mode; delete also
  purges the agent's knowledge-base scope first.
- `requireAgent(idOrName)` throws `Agent not found`.
- `listWithKnowledge()` -> agents with `kbDocs`.
- `api()` -> the extension API: `{ getStore, runTurn, createAgent, deleteAgent, exportAgentBundle, importAgentBundle }`.
- `publicSurface(chatUiPath)` -> what main.js publishes on `global.__lumaAgentManager`:
  `{ listAgents() -> [{ id, name, description, kbDocs }], buildTurn(agentIdOrName) -> turn | null, chatUiPath }`.
  Read by network sharing, the code-mode terminal bridge and triggers.

## Entry files

- `manifest.js`: same id, fields and text as legacy (comments rewritten without em-dashes). The renderer phase added the `ui/` modules to the `assets` lists of `chatUi` and `setupTab`, because the `/llm-ui/ext/` asset gate serves only declared files and the module entries import them.
- `main.js`: `{ activate, deactivate }`. `activate` builds the manager, wires
  `mcp-tools.js`'s store, syncs the chat mode, publishes the global, registers
  [AgentSetupInvoke](AgentSetupInvoke.md) with `context.setupTab.onInvoke`
  (answering `Agent store not ready` after deactivate) and resolves `api()`.
  `deactivate` drops the manager and deletes the global.
- `mcp-tools.js`: `{ tools, handler, setStore }` over one [AgentMcpTools](AgentMcpTools.md).
- `routes.js` (controller, `/api/ext/agent-manager`): `GET/POST /agents`,
  `PUT/DELETE /agents/:id`, `GET /tools`, `GET /agents/:id/export`,
  `POST /agents/import`, `GET/POST /agents/:id/kb`, `DELETE /agents/:id/kb/:docId`,
  `POST /agents/:id/chat` ([AgentSseChat](AgentSseChat.md)); same status codes
  and bodies as legacy.
- `chat-ui.js`, `setup-ui.js`, `setup-ui.css`: see [chat-ui](chat-ui.md) and [setup-ui](setup-ui.md). The Agents
  tab calls the setup.invoke actions in AgentSetupInvoke.
