# TabPageAccess

`core/browser/resolution-cache/TabPageAccess.js`

How the resolution cache reaches a live tab through a TabManager. Every failure
reads as "no answer".

## Methods

- `TabPageAccess.urlOf(tabManager, tabId)`: `tabManager.tabViewManager.getEntry(tabId).webContents.getURL()`
  when available (no page round trip), else the tab's `url` from
  `getAllTabs({ includeSilent: true })`; null otherwise.
- `TabPageAccess.run(tabManager, tabId, script)`: runs the script through
  `updateTab(tabId, { type: 'executeJs', payload })` and returns its result only
  when the call and the script both report success.
