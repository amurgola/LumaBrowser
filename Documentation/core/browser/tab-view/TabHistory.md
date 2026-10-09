# TabHistory

`core/browser/tab-view/TabHistory.js`

A tab's session history.

## Methods

- `new TabHistory(registry)`.
- `goBack(tabId)`, `goForward(tabId)` -> `{ success }`; `navigationHistory` first,
  the older `webContents.canGoBack/goBack` otherwise.
- `list(tabId)` -> `{ success, entries: [{ index, url, title }], activeIndex }` for the
  back/forward dropdown (title falls back to the URL), so the user can jump past a
  redirect the single-step back button skips over.
- `goToIndex(tabId, index)`.
- `TabHistory.refreshButtons(entry)`: updates `canGoBack` / `canGoForward` (false on error).
