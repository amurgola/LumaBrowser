# DashboardActions

`core/dashboard/DashboardActions.js`

The operations behind the `core.dashboard.*` IPC channels. Every method returns
the reply object the renderer receives.

## Methods

- `new DashboardActions({ dashboardService, getAgentDeps?, llmServerService?, artifactTaskStore?, artifactTaskScheduler?, getChatStore?, getExtensionManager? })`.
  `getAgentDeps`, `getChatStore` and `getExtensionManager` are called lazily
  (the browser and extensions do not exist yet when IPC is registered).
- `hasTasks()` whether a task store was given (the task channels exist only then).
- `open()` ensures and focuses the Dashboard tab: `{ success: tabId != null, tabId }`.
- `pin(rootId)` appends a live-artifact chain to the layout (no-op if placed),
  focuses the tab, and, if the tab was already open and the widget was newly
  added, sends `core.dashboard.pinned { rootId, pos }` so the page adds the card
  live. `{ success, added, tabId }`, or `{ success: false, error: 'rootId required' }`.
- `listLiveWidgets()` `{ success, widgets, extensionWidgets, hidden }`: every
  live-module chain at its latest version, the widgets active extensions
  contribute ([ExtensionWidgetCatalog](ExtensionWidgetCatalog.md)), and the
  dock's hidden list. `widgets` and `hidden` are empty when no artifact store
  is available; `extensionWidgets` is empty without an extension manager.
- `callExtension(extensionId, method, args)`: a widget's or live module's call
  onto an extension's published Dashboard API, through
  [ExtensionApiCall](../shell/extensions/ExtensionApiCall.md) (already an envelope).
- `setWidgetHidden(rootId, hidden)` `{ success, hidden }` (dock-only; placed widgets keep rendering).
- `getLayout()` / `setLayout(items)` `{ success, layout }`.
- `listTasks(rootId?)` `{ success, tasks }`, by root when given.
- `createTask(args)` `{ success, task }`.
- `updateTask(id, patch)` / `setTaskEnabled(id, enabled)` `{ success, task }` or
  `{ success: false, error: 'task not found' }`.
- `deleteTask(id)` `{ success: <deleted> }`.
- `runTaskNow(id)` the scheduler's reply, or `{ success: false, error: 'scheduler not available' }`.
- `listTaskRuns(taskId, opts)` `{ success, runs }`.
- `runTranscript(runId)` `{ success, run, messages }` for the run's hidden
  conversation, or an error for a missing run, a pruned transcript, or missing chat history.
- `openChat(conversationId?)` activates the LLM tab and, when a conversation is
  given, sends `core.llmServer.openConversation` to it. `{ success: opened }`.

## Why

`runTranscript` only reads the conversation the run row points at, so the
channel cannot be used to browse arbitrary conversations. Sends to a page are
best effort: the main action (pinning, focusing the chat) has already happened.
