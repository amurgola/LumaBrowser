# TabProvider

`core/palette/providers/TabProvider.js`

Search palette provider for the open tabs of the window the palette was opened
in: title first (weight 1), then the address without its scheme (0.75). Silent
and hidden tabs are skipped; the active tab is tagged `Current`.

## Methods

- `new TabProvider({ getTabs })`: `getTabs(windowId)` is
  `TabViewManager#getWindowTabs`.
- `search(query, { windowId, limit = 5 })`: `tab` rows with `data.tabId`.
- `TabProvider.address(url)`: the URL without `http(s)://` and a trailing slash.
