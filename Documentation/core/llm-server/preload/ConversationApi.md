# ConversationApi

`core/llm-server/preload/ConversationApi.js`

llmDiagAPI section `conv`: conversation history (SQLite-backed), its per-conversation options, mode metadata, artifacts and regeneration variants.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `conv.list(opts)` | invoke `core.llmServer.conv.list` |
| `conv.get(id)` | invoke `core.llmServer.conv.get` |
| `conv.create(data)` | invoke `core.llmServer.conv.create` |
| `conv.rename(id, title)` | invoke `core.llmServer.conv.rename` |
| `conv.delete(id)` | invoke `core.llmServer.conv.delete` |
| `conv.archive(id, archived)` | invoke `core.llmServer.conv.archive` |
| `conv.pin(id, pinned)` | invoke `core.llmServer.conv.pin` |
| `conv.messages(conversationId)` | invoke `core.llmServer.conv.messages` |
| `conv.export(conversationId, kind)` | invoke `core.llmServer.conv.export` |
| `conv.addMessage(msg)` | invoke `core.llmServer.conv.addMessage` |
| `conv.deleteMessage(id)` | invoke `core.llmServer.conv.deleteMessage` |
| `conv.updateMessage(id, patch)` | invoke `core.llmServer.conv.updateMessage` |
| `conv.clearMessages(id)` | invoke `core.llmServer.conv.clearMessages` |
| `conv.search(q, opts)` | invoke `core.llmServer.conv.search` |
| `conv.wipeAll()` | invoke `core.llmServer.chat.wipeAll` |
| `conv.autotitle(id)` | invoke `core.llmServer.conv.autotitle` |
| `conv.setTools(id, enabled)` | invoke `core.llmServer.conv.setTools` |
| `conv.setDisabledTools(id, names)` | invoke `core.llmServer.conv.setDisabledTools` |
| `conv.setChoices(id, enabled)` | invoke `core.llmServer.conv.setChoices` |
| `conv.setReasoningEffort(id, position)` | invoke `core.llmServer.conv.setReasoningEffort` |
| `conv.meta.get(conversationId)` | invoke `core.llmServer.conv.meta.get` |
| `conv.meta.set(conversationId, patch)` | invoke `core.llmServer.conv.meta.set` |
| `conv.artifacts(conversationId)` | invoke `core.llmServer.conv.artifacts` |
| `conv.variants(group)` | invoke `core.llmServer.conv.variants` |
| `conv.setVariant(messageId)` | invoke `core.llmServer.conv.setVariant` |
