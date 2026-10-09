# ArtifactApi

`core/llm-server/preload/ArtifactApi.js`

llmDiagAPI section: saved artifacts, public share links, the Dashboard hand-offs, and the persistent data and host bridge behind live modules. share, openDashboard and pinToDashboard are desktop only (the web shim lacks them and the chat hides their affordances).

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `share.status()` | invoke `core.sharing.shareLink.status` |
| `share.create(kind, targetId, title)` | invoke `core.sharing.shareLink.create` |
| `artifact.open(id)` | invoke `core.llmServer.artifact.open` |
| `artifact.get(id)` | invoke `core.llmServer.artifact.get` |
| `artifact.listAll(opts)` | invoke `core.llmServer.artifact.listAll` |
| `artifact.versions(idOrRootId)` | invoke `core.llmServer.artifact.versions` |
| `artifact.delete(id)` | invoke `core.llmServer.artifact.delete` |
| `artifact.deleteRoot(idOrRootId)` | invoke `core.llmServer.artifact.deleteRoot` |
| `openDashboard()` | invoke `core.dashboard.open` |
| `pinToDashboard(rootId)` | invoke `core.dashboard.pin` |
| `artifactData.all(idOrRootId)` | invoke `core.llmServer.artifactData.all` |
| `artifactData.mutate(idOrRootId, ops)` | invoke `core.llmServer.artifactData.mutate` |
| `artifactData.onChanged(cb)` | subscribe `core.llmServer.artifactData.changed` |
| `liveApi.fetchPage(params)` | invoke `core.llmServer.liveApi.fetch` |
| `liveApi.openTab(params)` | invoke `core.llmServer.liveApi.openTab` |
| `liveApi.extCall(params)` | invoke `core.llmServer.liveApi.extCall` |
| `liveApi.onExtEvent(extensionId, cb)` | subscribe `ext.<extensionId>.dashboard.event` (the id must match `/^[a-z0-9-]+$/`, else `extensionId required` is thrown) |
