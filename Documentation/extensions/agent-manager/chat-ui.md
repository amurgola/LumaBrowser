# chat-ui.js (agent-manager entry)

`extensions/agent-manager/chat-ui.js`

The chat-page entry for the 'agent-chat' mode, loaded as a module: when
`window.LumaChatExt.registerMode` exists it registers
[AgentChatClient](ui/AgentChatClient.md)`.mode()`. The manifest's
`chatUi.assets` lists its `ui/` modules for the asset gate.

The web PWA also loads this bundle from `/sharing/agents/chat-ui.js`
(SharedAgents.WEB_CHAT_UI_URL); see the change request in the wave report
about serving its imports there.

## Globals

Reads `window.LumaChatExt`.
