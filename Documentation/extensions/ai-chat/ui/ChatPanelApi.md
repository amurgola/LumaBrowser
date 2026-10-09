# ChatPanelApi

`extensions/ai-chat/ui/ChatPanelApi.js`

The third implementation of the llmDiagAPI chat contract (after the LLM tab
preload and the PWA shim): the chat slice only, over the main window's
`window.ipcBridge` passthrough. No new channels: every `core.llmServer.*`
handler is a global `ipcMain.handle`, and chatEvent goes to the invoking
webContents, so the panel gets its own stream keyed by its request ids.

## Methods

- `ChatPanelApi.build(bridge)` (`invoke(channel, ...args)`,
  `on(channel, cb)` returning an unsubscriber); throws
  "ChatPanelApi.build: an ipcBridge with invoke/on is required". Returns:
  - `getDefaults`, `listModels`, `getState`, `openSetup`, `chat2`,
    `chatAbort`, `pickChatAttachment` (`chat.pickAttachment`),
    `getLastModelRef`, `setLastModelRef`, `openDashboard` (`core.dashboard.open`),
    `pinToDashboard` (`core.dashboard.pin`);
  - subscriptions `onState` (`core.llmServer.state`), `onChatEvent`,
    `onOpenConversation`, `artifactData.onChanged`;
  - `conv.*` (`CONVERSATION_METHODS` plus `conv.meta.get/set`), `chat.*`
    (`CHAT_METHODS`, including `approvalRespond`/`takeoverRespond`),
    `artifact.*` (`ARTIFACT_METHODS`), `artifactData.all/mutate`.

No setup, diagnostics, image, video, voice or placement surface: the panel
gates those affordances on absence, like the web client.

## Globals

None (the caller passes the bridge).
