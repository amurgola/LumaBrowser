# HistoryRecorder

`app/browser/HistoryRecorder.js`

Records the user's own browsing into history.

## Methods

- `new HistoryRecorder({ tabViewManager, historyService, automationKinds?, internalKinds? })`;
  the kinds default to [TabKinds](../../core/browser/tab-view/TabKinds.md)
  `AUTOMATION` and `INTERNAL`.
- `attach()` listens for `tabNavigated` and `tabTitleUpdated`.
- `onNavigated(tabId, url)` records a visit (with the tab's current title) and
  remembers its row id for the tab; returns the visit or null.
- `onTitleUpdated(tabId, title)` backfills the title on the tab's last row.

Never history: silent agent tabs (web search), hidden keep-alive tabs,
automation tabs (CDP) and internal app tabs (LLM, dashboard). HistoryService
itself drops non-http(s) URLs and quick repeats.
