# TabEntry

`core/browser/tab-view/TabEntry.js`

One browser tab's live state. `TabViewManager.getEntry(id)` returns it, and many
callers (TabManager, TabPreviewManager, On Demand, the dashboard) read its fields.

## Fields

`id`, `view`, `webContents`, `partition`, `silent`, `kind`, `pinned`, `keepAlive`,
`hidden`, `url`, `title`, `loading`, `canGoBack`, `canGoForward`, `zoomLevel`,
`createdAt`, `openerTabId` (the tab whose page opened this one, else null),
`lastNavigatedAt`, `lastActivatedAt` (set when the tab is brought to the front;
the AI chat offers the page the user was just on), `lastHttpStatus`, `favicon`,
`history` (last 50 visits),
`consoleLogs`, `dialogHandler` (set by TabManager's dialog handling).

Tab-layer internals that tests and the tab layer read: `_nav` (navigation
generations), `_errorPageFor` (the failed URL while the error page shows),
`_renderedSourceUrl` (file URL of an inline-rendered CSV), `_crashedAt`.

## Methods

- `new TabEntry({ id, view, partition, url, title, kind, silent, pinned, keepAlive, hidden, openerTabId })`.
- `applyNavEvent(kind, payload)` runs [NavigationGenerations](NavigationGenerations.md)`.decide`
  against `_nav`, stores the next state and returns the decision.
- `isInternal()`, `isAutomation()` (see [TabKinds](TabKinds.md)).
- `isInStrip()`: not silent and not hidden.
- `isRegularBrowsing()`: not silent, not internal, not automation.
