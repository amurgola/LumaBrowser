# MonitorHistoryPage

`extensions/page-change-detector/ui/MonitorHistoryPage.js`

The Page Monitors settings page: the summary, the "Open Page Monitors panel"
button, and a paged check history for any monitor.

## Methods

- `MonitorHistoryPage.freshView(monitorId = null)`:
  `{ monitorId, page: 0, pageSize: 25, changedOnly: true }`.
- `new MonitorHistoryPage(root, { view, invoke, getMonitors, onOpenPanel })`;
  `view` is public and kept by the caller across activations.
- `show(monitorId)`: a fresh view of that monitor, then `refresh()`.
- `refresh()`: summary, selector (keeps the shown monitor, else the selected
  one), mode buttons, then `loadPage()`.
- `syncMonitors()`: after a list reload, rebuilds selector and summary
  without reloading history; adopts the first monitor when the shown one is
  gone.
- `loadPage()`: `getHistoryPaged(id, { page, pageSize, changedOnly })`; stats
  `N changes recorded, T changes|checks in this view`, items, pager. The texts
  for no monitor, an empty page and a load error are as legacy.

Changing the selector or mode resets to page 0.

## Globals

Reads `document` only.
