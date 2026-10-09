# ChatTasksApi

`core/llm-server/preload/ChatTasksApi.js`

llmDiagAPI section: chat scheduled tasks (`schedTasks`) and triggers (`triggers`), with their lifecycle event streams, for the sidebar's Scheduled and Triggers sections and their runs views.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `schedTasks.list()` | invoke `core.llmServer.schedTasks.list` |
| `schedTasks.get(id)` | invoke `core.llmServer.schedTasks.get` |
| `schedTasks.runs(taskId, opts)` | invoke `core.llmServer.schedTasks.runs` |
| `schedTasks.update(id, patch)` | invoke `core.llmServer.schedTasks.update` |
| `schedTasks.delete(id)` | invoke `core.llmServer.schedTasks.delete` |
| `schedTasks.runNow(id)` | invoke `core.llmServer.schedTasks.runNow` |
| `onSchedTasksEvent(cb)` | subscribe `core.llmServer.schedTasks.event` |
| `triggers.list()` | invoke `core.llmServer.triggers.list` |
| `triggers.get(id)` | invoke `core.llmServer.triggers.get` |
| `triggers.runs(triggerId, opts)` | invoke `core.llmServer.triggers.runs` |
| `triggers.deliveries(triggerId, opts)` | invoke `core.llmServer.triggers.deliveries` |
| `triggers.update(id, patch)` | invoke `core.llmServer.triggers.update` |
| `triggers.delete(id)` | invoke `core.llmServer.triggers.delete` |
| `triggers.test(id)` | invoke `core.llmServer.triggers.test` |
| `triggers.simulate(id, body)` | invoke `core.llmServer.triggers.simulate` |
| `triggers.pickFile(id)` | invoke `core.llmServer.triggers.pickFile` |
| `triggers.adoptLatestEvent(id)` | invoke `core.llmServer.triggers.adoptLatestEvent` |
| `triggers.approve(runId, decision)` | invoke `core.llmServer.triggers.approve` |
| `triggers.setSecret(id, value)` | invoke `core.llmServer.triggers.setSecret` |
| `triggers.replay(runId)` | invoke `core.llmServer.triggers.replay` |
| `triggers.versions(triggerId)` | invoke `core.llmServer.triggers.versions` |
| `triggers.persistedTabs()` | invoke `core.llmServer.triggers.persistedTabs` |
| `triggers.clearMemory(triggerId)` | invoke `core.llmServer.triggers.clearMemory` |
| `triggers.rollback(triggerId, n)` | invoke `core.llmServer.triggers.rollback` |
| `onTriggersEvent(cb)` | subscribe `core.llmServer.triggers.event` |
