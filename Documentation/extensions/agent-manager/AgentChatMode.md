# AgentChatMode

`extensions/agent-manager/AgentChatMode.js`

The "Chat with agent" chat mode (`agent-chat`): one mode for every agent;
chat-ui.js picks the agent and persists `meta.data.agentId`.

## Methods

- `new AgentChatMode({ chat, store, knowledge })`.
- `buildTurn(meta)`: an unknown agent -> `{ systemPrompt: DELETED_PROMPT }`;
  otherwise `{ systemPrompt, agent: <has tools>, kbScope, allowedTools?, modelRef? }`
  from [AgentKnowledgeGrant](AgentKnowledgeGrant.md); the pinned model only
  while [AgentModels](AgentModels.md) says it is installed (a stale pin falls
  back to the composer's model).
- `sync()`: registers the descriptor (`launcher: 'sidebar'`, `requirements: ['llm']`,
  `chatUiUrl: chat.uiUrl('chat-ui.js')`) while agents exist, else unregisters.
  Idempotent; a no-op without `context.chat`.
