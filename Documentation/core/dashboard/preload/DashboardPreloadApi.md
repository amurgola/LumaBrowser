# DashboardPreloadApi

`core/dashboard/preload/DashboardPreloadApi.js` (entry: `core/dashboard/dashboard-tab-preload.js`)

The Dashboard tab's whole renderer surface, `window.dashboardAPI`. The Dashboard
is an unsandboxed tab view (TabViewFactory: `sandbox: false`), so the preload
entry requires this class; the entry itself only calls `expose`.

## Methods

- `DashboardPreloadApi.expose(contextBridge, ipcRenderer)` exposes the surface.
  A contextBridge throw (contextIsolation off) is logged with
  `[dashboard-tab-preload] failed to expose dashboardAPI`, never propagated
  (bug L3: an unguarded throw made the page report the misleading "must run
  inside LumaBrowser's Dashboard tab").
- `DashboardPreloadApi.build(ipcRenderer)` returns the surface object.
- Subscriptions come from [IpcSubscription](../../shared/ipc/IpcSubscription.md)`.of(ipcRenderer, channel)`:
  `(cb) => detach`, one listener per call, `cb(payload)`, and the detach removes
  only that listener.

## Surface (a contract: keep it minimal)

Live-module code runs in the page's global scope and can read this object.

| Key | Channel(s) |
|---|---|
| `widgets.listLive()`, `widgets.setHidden(rootId, hidden)` | `core.dashboard.widgets.*` |
| `artifact.get(id)` | `core.llmServer.artifact.get` |
| `layout.get()`, `layout.set(items)` | `core.dashboard.layout.*` |
| `artifactData.all/mutate/onChanged` | `core.llmServer.artifactData.*` (shared with the LLM tab) |
| `liveApi.fetchPage(params)`, `liveApi.openTab(params)`, `liveApi.extCall(params)` | `core.llmServer.liveApi.fetch`, `.openTab`, `.extCall` |
| `liveApi.onExtEvent(extensionId, cb)`, `ext.onEvent(extensionId, cb)` | `ext.<extensionId>.dashboard.event` (the id must match `/^[a-z0-9-]+$/`, else `extensionId required` is thrown, so page code never names a channel) |
| `ext.call(extensionId, method, args)` | `core.dashboard.ext.call` |
| `tasks.list/create/update/setEnabled/delete/runNow/runs/runTranscript/onEvent` | `core.dashboard.tasks.*` |
| `onPinned(cb)` | `core.dashboard.pinned` |
| `openChat(conversationId)` | `core.dashboard.openChat` |

Each invoke forwards at most its declared number of arguments (legacy used
fixed-arity arrows, so extra arguments never reached main).

## Packaging

Required by a preload, so it must ship as plain JS (bytecode SKIP_FILES and
asarUnpack), together with `core/shared/ipc/IpcSubscription.js`: see the change
requests in the wave reports.
