# ChatModesApi

`core/llm-server/preload/ChatModesApi.js`

llmDiagAPI sections `chat` and `setup`: extension chat modes, side completions, the agent-tool catalog, the root-jailed workspace of a folder conversation, and the extension Setup tabs with their auth-free invoke.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `chat.listModes()` | invoke `core.llmServer.chat.listModes` |
| `chat.complete(args)` | invoke `core.llmServer.chat.complete` |
| `chat.completeStream(args)` | invoke `core.llmServer.chat.completeStream` |
| `chat.completeAbort(requestId)` | invoke `core.llmServer.chat.completeAbort` |
| `chat.agentTools()` | invoke `core.llmServer.chat.agentTools` |
| `chat.setGlobalToolEnabled(name, enabled)` | invoke `core.llmServer.chat.setGlobalToolEnabled` |
| `chat.previewSystemPrompt(opts)` | invoke `core.llmServer.chat.previewSystemPrompt` |
| `chat.takeIntent()` | invoke `core.llmServer.chat.takeIntent` |
| `chat.readWorkspaceFile(args)` | invoke `core.llmServer.chat.readWorkspaceFile` |
| `chat.workspace.info(args)` | invoke `core.llmServer.chat.workspace.info` |
| `chat.workspace.list(args)` | invoke `core.llmServer.chat.workspace.list` |
| `chat.workspace.read(args)` | invoke `core.llmServer.chat.workspace.read` |
| `chat.workspace.write(args)` | invoke `core.llmServer.chat.workspace.write` |
| `chat.workspace.create(args)` | invoke `core.llmServer.chat.workspace.create` |
| `chat.workspace.rename(args)` | invoke `core.llmServer.chat.workspace.rename` |
| `chat.workspace.remove(args)` | invoke `core.llmServer.chat.workspace.remove` |
| `setup.listTabs()` | invoke `core.llmServer.setup.listTabs` |
| `setup.invoke(extId, action, payload)` | invoke `core.llmServer.setup.invoke` |
