# DashboardIpcHandlers

`core/dashboard/DashboardIpcHandlers.js`

IPC controller for the Dashboard: routes `core.dashboard.*` to DashboardActions.
Each handler is wrapped by `IpcEnvelope.enveloped`, so a throw replies
`{ success: false, error }`.

## Methods

- `new DashboardIpcHandlers(deps)`; `deps` as for DashboardActions.
- `register()` registers 8 channels, plus 8 task channels when `artifactTaskStore` is given:
  - `core.dashboard.open` -> `open()`
  - `core.dashboard.pin(rootId)` -> `pin`
  - `core.dashboard.widgets.listLive` -> `listLiveWidgets()` (failure adds `widgets: [], extensionWidgets: [], hidden: []`)
  - `core.dashboard.ext.call(extensionId, method, args)` -> `callExtension` (failure adds `result: null`)
  - `core.dashboard.widgets.setHidden(rootId, hidden)` -> `setWidgetHidden`
  - `core.dashboard.layout.get` -> `getLayout()` (failure adds `layout: []`)
  - `core.dashboard.layout.set(items)` -> `setLayout`
  - `core.dashboard.tasks.list(rootId)` -> `listTasks` (failure adds `tasks: []`)
  - `core.dashboard.tasks.create(args)` -> `createTask`
  - `core.dashboard.tasks.update(id, patch)` -> `updateTask`
  - `core.dashboard.tasks.setEnabled(id, enabled)` -> `setTaskEnabled`
  - `core.dashboard.tasks.delete(id)` -> `deleteTask`
  - `core.dashboard.tasks.runNow(id)` -> `runTaskNow`
  - `core.dashboard.tasks.runs(taskId, opts)` -> `listTaskRuns` (failure adds `runs: []`)
  - `core.dashboard.tasks.runTranscript(runId)` -> `runTranscript`
  - `core.dashboard.openChat(conversationId)` -> `openChat`
