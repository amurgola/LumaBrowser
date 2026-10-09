# ExtensionWidgetCatalog

`core/dashboard/ExtensionWidgetCatalog.js`

Lists the Dashboard widgets every active extension contributes (manifest
`dashboard.widgets`).

## Methods

- `new ExtensionWidgetCatalog(getExtensionManager)`; the getter is lazy (the
  manager is built after the dashboard IPC registers).
- `list()` -> `[{ rootId, extensionId, widgetId, title, url, w, h, context }]`
  over `extensionManager.extensions` (the active map, activation order).
  `rootId` is `ext:<extensionId>:<widgetId>`
  ([DashboardContribution](../shell/extensions/DashboardContribution.md)),
  `url` the served module path (`/llm-ui/ext/<id>/<file sub-path>`),
  `context` the API method the chat's `@dashboard` calls for the widget's text
  (null when the widget declares none). Widgets whose file climbs out of the
  folder, and extensions without a dashboard block, are skipped. Empty without
  a manager.

Read by [DashboardActions](DashboardActions.md)`.listLiveWidgets` as
`extensionWidgets` and by [DashboardSnapshot](DashboardSnapshot.md) to resolve
the placed extension widgets.
