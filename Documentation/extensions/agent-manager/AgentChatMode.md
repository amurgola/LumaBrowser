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
  Idempotent; a no-op without `context.chat`. The descriptor's `delegate` block
  makes each agent a target of the chat's `delegate_task`
  ([DelegationTools](../../core/llm-server/chat/delegation/DelegationTools.md)).
- `delegateTargets()`: one target per agent, read live: `{ id: 'agent:<agentId>',
  label: 'Agent: <name>', description (or 'A custom agent.'), params: { task } }`.
- `startDelegated(targetId, args)`: `{ data: { agentId, agentName }, message:
  <task trimmed>, title: '<name>: <task>' }` (the meta the agent picker persists),
  or `{ error }` for an unknown agent.
- `TARGET_PREFIX` is `'agent:'`.
