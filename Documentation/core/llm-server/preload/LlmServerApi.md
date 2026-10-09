# LlmServerApi

`core/llm-server/preload/LlmServerApi.js`

llmDiagAPI section: LLM defaults and the server lifecycle, the human-in-the-loop answers, the tab's persisted UI state, and the host pushes that drive the page (server events, state, show Chat / Setup, open a conversation).

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `getDefaults()` | invoke `core.llmServer.getDefaults` |
| `getApprovalPolicy()` | invoke `core.llmServer.chat.getApprovalPolicy` |
| `setApprovalPolicy(policy)` | invoke `core.llmServer.chat.setApprovalPolicy` |
| `setDefaults(payload)` | invoke `core.llmServer.setDefaults` |
| `getAutoUnloadMs()` | invoke `core.llmServer.getAutoUnloadMs` |
| `setAutoUnloadMs(ms)` | invoke `core.llmServer.setAutoUnloadMs` |
| `getModelCaps(modelPath)` | invoke `core.llmServer.getModelCaps` |
| `getServerStatus()` | invoke `core.llmServer.getServerStatus` |
| `getState()` | invoke `core.llmServer.getState` |
| `openSetup(opts)` | invoke `core.llmServer.openSetup` |
| `getPeerGpus()` | invoke `core.llmServer.getPeerGpus` |
| `getRamPinStatus()` | invoke `core.llmServer.getRamPinStatus` |
| `getGroupRouterStatus()` | invoke `core.llmServer.getGroupRouterStatus` |
| `startServer()` | invoke `core.llmServer.startServer` |
| `stopServer()` | invoke `core.llmServer.stopServer` |
| `chatAbort()` | invoke `core.llmServer.chatAbort` |
| `takeoverRespond(action)` | invoke `core.llmServer.chat.takeoverRespond` |
| `approvalRespond(decision)` | invoke `core.llmServer.chat.approvalRespond` |
| `getUiMode()` | invoke `core.llmServer.getUiMode` |
| `setUiMode(mode)` | invoke `core.llmServer.setUiMode` |
| `consumePendingSetupExpand()` | invoke `core.llmServer.consumePendingSetupExpand` |
| `getSidebarCollapsed()` | invoke `core.llmServer.getSidebarCollapsed` |
| `setSidebarCollapsed(v)` | invoke `core.llmServer.setSidebarCollapsed` |
| `getLastModelRef()` | invoke `core.llmServer.getLastModelRef` |
| `setLastModelRef(ref)` | invoke `core.llmServer.setLastModelRef` |
| `onServerEvent(cb)` | subscribe `core.llmServer.serverEvent` |
| `onState(cb)` | subscribe `core.llmServer.state` |
| `onShowChat(cb)` | subscribe `core.llmServer.showChat` |
| `onShowSetup(cb)` | subscribe `core.llmServer.showSetup` |
| `onOpenConversation(cb)` | subscribe `core.llmServer.openConversation` |
