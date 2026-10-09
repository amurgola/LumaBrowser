# WidgetCatalog

`core/dashboard/ui/js/WidgetCatalog.js`

Every placeable widget, from `dashboardAPI.widgets.listLive`: live-module
chains (rootId -> `{ kind: 'live', title, conversationId, latestId }`) and
extension widgets (rootId -> `{ kind: 'extension', title, url, extensionId,
widgetId, w, h }`, from the reply's `extensionWidgets`), plus the user's hidden
set, which covers both kinds.

## Methods

- `refresh()`: re-lists; a failure leaves the catalog empty and keeps the hidden set.
- `get(rootId)`, `isExtension(rootId)`, `size`, `visibleEntries()`,
  `hiddenEntries()` (`[rootId, meta]`, live entries first, then extension
  entries).
- `setHidden(rootId, hidden)`: persists (failure ignored), then mirrors locally.
- `showHidden`: whether the dock lists hidden rows.
