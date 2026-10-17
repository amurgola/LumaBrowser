# ChatTurnApi

`core/llm-server/preload/ChatTurnApi.js`

llmDiagAPI section: one chat turn through the unified router (local and remote providers), the model picker list and the Tune panel's model settings, chat attachments (files, an open tab's page, the Dashboard's widgets), the documentation source's status, and the stream of chat events.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `listModels()` | invoke `core.llmServer.listModels` |
| `modelSettings.get(ref)` | invoke `core.llmServer.modelSettings.get` |
| `modelSettings.setModel(ref, payload)` | invoke `core.llmServer.modelSettings.setModel` |
| `modelSettings.saveProfile(input)` | invoke `core.llmServer.modelSettings.saveProfile` |
| `modelSettings.deleteProfile(id)` | invoke `core.llmServer.modelSettings.deleteProfile` (all four absent on the web client) |
| `chat2(args)` | invoke `core.llmServer.chat2` |
| `pickChatAttachment()` | invoke `core.llmServer.chat.pickAttachment` |
| `readDroppedAttachments(files)` | invoke `core.llmServer.chat.readAttachments` |
| `pageContext.listTabs()` | invoke `core.llmServer.pageContext.listTabs` |
| `pageContext.readTab(tabId)` | invoke `core.llmServer.pageContext.readTab` |
| `pageContext.readDashboard()` | invoke `core.llmServer.pageContext.readDashboard` |
| `docsSource.status()` | invoke `core.llmServer.docsSource.status` (absent on the web client; the composer feature-detects it) |
| `onChatEvent(cb)` | subscribe `core.llmServer.chatEvent` |
