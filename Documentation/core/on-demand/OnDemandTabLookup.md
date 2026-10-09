# OnDemandTabLookup

`core/on-demand/OnDemandTabLookup.js`

Fail-soft reads of the TabViewManager for the On Demand overlay. Never throws.

## Methods

- `new OnDemandTabLookup(tabViewManager)`.
- `activeTabId()` uses `getActiveTabId()` when present, else `activeTabId`; `null` on error.
- `entry(tabId)` uses `getEntry(tabId)`, else `tabs.get(tabId)`; `null` when missing.
- `activeEntry()`, `tabInfo(tabId)` (`{ url, title }` with `''` defaults, or `null`),
  `pageRect()` (via `OnDemandPlacement.pageRect`).
- `OnDemandTabLookup.isWebPage(entry)`: kind `user` (the default). Internal tabs
  (LLM chat, dashboard) are not pages.
- `OnDemandTabLookup.isShownPage(entry)`: a web page that is neither silent nor hidden.

## Why

The overlay, its keyboard router and the service's `getTabInfo` all need the
same tolerant reads; the TabViewManager can be mid-teardown when tab events fire.
