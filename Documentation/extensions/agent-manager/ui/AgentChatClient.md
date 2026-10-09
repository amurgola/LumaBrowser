# AgentChatClient

`extensions/agent-manager/ui/AgentChatClient.js`

The client hooks of the 'agent-chat' chat mode.

## Methods

- `AgentChatClient.mode()`: `{ id: 'agent-chat', openSetup, decorateComposer }`
  for the chat-extension registry.
- `AgentChatClient.openSetup(api)`: lists agents
  ([AgentDirectory](AgentDirectory.md)); none -> null (no conversation is
  created); else the [AgentPicker](AgentPicker.md) choice as
  `{ agentId, agentName }` (the conversation's mode meta, read server-side
  by buildTurn) or null.
- `AgentChatClient.decorateComposer(els, ctx)`: placeholder "Message <agentName>..."
  when `ctx.meta.data.agentName` is set.
