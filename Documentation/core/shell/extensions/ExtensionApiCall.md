# ExtensionApiCall

`core/shell/extensions/ExtensionApiCall.js`

One guarded call from a renderer (the Dashboard page's `dashboardAPI.ext.call`,
a live module's `luma.ext(id).call`) onto an active extension's public API.

## Methods (static)

- `async invoke(extensionManager, extensionId, method, args)` ->
  `{ success: true, result }` or `{ success: false, error }`. Never throws.
  In order: the id must match `/^[a-z0-9-]+$/` (`extensionId required`),
  `method` must be a non-empty string (`method required`), `args` must be an
  array of at most 8 (`args must be an array`, `at most 8 arguments`), the
  extension must be active (`extension "<id>" is not active`), its manifest's
  `dashboard.api` must list the method (`"<id>" does not publish "<m>"`), the
  API must implement it (`"<id>" has no "<m>" method`). The method runs with
  the API object as `this`; a throw becomes the error message; a result that
  cannot cross IPC (`IpcEnvelope.isCloneable`) is refused
  (`"<m>" returned a value that cannot cross IPC`); `undefined` becomes `null`.
- `async invokeWidgetContext(extensionManager, extensionId, widgetId, args)`:
  the same guard for the method a widget's manifest entry names as `context`
  ([DashboardContribution](DashboardContribution.md)`.contextMethod`), which
  need not be in `dashboard.api`. Refusals: `extensionId required`,
  `extension "<id>" is not active`, `"<id>" widget "<widget>" shares no
  context` (no such widget, or no `context`), then the argument and
  implementation checks above. Called only by the host's
  [DashboardSnapshot](../../dashboard/DashboardSnapshot.md), never from a
  renderer channel.

## Why

An extension's activate() API is also what `mcp-tools.js` and `routes.js`
read, so it may hold methods a page must never reach. The manifest allow-list
decides, not the API's shape, and the renderer only ever sees an envelope.
