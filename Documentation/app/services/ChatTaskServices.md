# ChatTaskServices

`app/services/ChatTaskServices.js`

Builds what the agentic chat persists and runs in the background.

## Methods

- `new ChatTaskServices(ctx)`; `build()` adds:
  - `artifactStore` (files in `<dataDir>/artifacts`, served from `ctx.webBase()`),
    `artifactDataStore`, `liveApi` (one instance for IPC and the gateway route,
    so its fetch cap is global);
  - `backgroundRunGate`: one gate for scheduled tasks, artifact refreshes and
    triggers, so background runs never overlap on the model slot;
  - `artifactTaskStore`, `artifactTaskScheduler` (gate passed to the
    constructor, events on `core.dashboard.tasks.event`);
  - `scheduledTaskStore`, `emitSchedTasksEvent` (`core.llmServer.schedTasks.event`),
    `scheduledTaskScheduler` (gate passed to the constructor), and the core
    `scheduled-task` chat mode registered;
  - `ragService` at `<dataDir>/rag`, published as `__lumaRagService`;
  - `docsKnowledgeBase` ([DocsKnowledgeBase](../../core/rag/DocsKnowledgeBase.md))
    over the shipped documentation index (`resources/docs-rag/docs-rag.db` when
    packaged, `dist/docs-rag/docs-rag.db` in a dev checkout; opened on first
    use), published as `__lumaDocsKnowledgeBase`.
- `ChatTaskServices.chatStore()` the chat router's store, or null before the LLM
  IPC handlers built the router.

Schedulers start in [HeavyServices](../ready/HeavyServices.md), once the agent
runtime exists.
