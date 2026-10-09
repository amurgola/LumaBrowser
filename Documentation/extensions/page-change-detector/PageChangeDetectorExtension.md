# PageChangeDetectorExtension

`extensions/page-change-detector/PageChangeDetectorExtension.js`

Main-process side of Page Monitors: watch a page, or picked elements on it,
on a schedule and alert by desktop notification or webhook when its text
changes.

## Methods

- `new PageChangeDetectorExtension(overrides?)`: test overrides `{ webhook,
  notifier, broadcastSend, sleep }`.
- `activate(context)`: [MonitorSchema](MonitorSchema.md)`.ensure(context.db)`,
  wires repositories, [MonitorTabs](MonitorTabs.md),
  [MonitorChecker](MonitorChecker.md), [MonitorScheduler](MonitorScheduler.md),
  [ElementPicker](ElementPicker.md) and [MonitorService](MonitorService.md)
  over `context.db` and `context.browser`, arms every enabled monitor (logs
  `started N enabled monitor(s)`), registers
  [MonitorIpcHandlers](MonitorIpcHandlers.md) and resolves the public API.
- `deactivate()`: stops every timer and forgets in-flight checks.
- `getApi()`: the public API, or null while inactive.

Public API (read by `routes.js`, `mcp-tools.js` and core's
[PageChangeSource](../../core/llm-server/chat/triggers/PageChangeSource.md)):
`getAllMonitors`, `getMonitor`, `getHistory(monitorId, limit = 20)`,
`getHistoryPaged`, `createMonitor`, `updateMonitor`, `deleteMonitor`,
`checkMonitorNow`, `pickElementsForMonitor`, `onChange(cb)` (returns the
unsubscribe function).

## Entry files

- `manifest.js`: id `page-change-detector`, tables `page_change_monitors` and
  `page_change_history`, `core:browser`, right-panel `panel.html`, settings
  `settings.html`, routes at `/api/page-change-detector`, `mcpTools`.
- `main.js`: `{ activate, deactivate, getApi }` delegating to one instance.
- `mcp-tools.js`: `{ tools: MonitorTools.TOOLS, handler }`, the handler
  dispatching onto `main.getApi()` through [MonitorTools](MonitorTools.md).
- `routes.js`: REST controller (list, create, get, patch, delete, history
  with `?limit` or `?page&pageSize&changedOnly`, check, pick); shapes unchanged.
- `picker.js`: the in-page element picker, a self-contained IIFE injected by
  ElementPicker with `executeJs`. It runs in the page, not in Node, so it is
  not a class; only its comments changed.
- `renderer.js`: module entry (loaded by the shell as `type="module"`) that
  sets `window.__ext_page_change_detector` over
  [ui/PageMonitorsRenderer](ui/PageMonitorsRenderer.md).
- `panel.html`, `settings.html`: copied unchanged. The renderer listens on `ext.page-change-detector.changed` (see
  [MonitorBroadcast](MonitorBroadcast.md)).
