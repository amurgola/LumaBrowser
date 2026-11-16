# MenuTab

`core/shell/context-menu/MenuTab.js`

The browser tab a right-clicked webContents belongs to, if any, and the tab
actions the [ContextMenu](../ContextMenu.md) needs.

## Methods

- `MenuTab.resolve(getTabViewManager, webContents)` never throws. Non-tab
  webContents, silent (agent work) tabs and a throwing manager resolve to a
  MenuTab with no tab.
- `isTabPage`, `isInternal` (entry kind in the manager class's
  `INTERNAL_KINDS`), `canGoBack`, `canGoForward`.
- `goBack()`, `goForward()`, `reload()` act on the entry's tab.
- `openInNewTab(url, activate = false)` creates a tab right after the current
  one, in the same partition.

## Tab manager contract

Duck-typed against the TabViewManager: `findTabIdByWebContents(wc)`, `getEntry(id)`, `order`,
`createTab(url, { activate, partition, index })`, `goBack`, `goForward`,
`reload`, and the static `INTERNAL_KINDS` Set.
