# TabPageTools

`core/browser/tab-view/TabPageTools.js`

Find in page, print, and the DevTools toggle.

## Methods

- `new TabPageTools(registry)`.
- `findInPage(tabId, text, { forward = true, findNext = false, matchCase = false })`
  -> `{ success, requestId }`; empty text clears the find instead. Results arrive on
  `tab-view:found-in-page` ([TabPageEvents](TabPageEvents.md)).
- `stopFindInPage(tabId, action = 'clearSelection')`.
- `print(tabId)`: the system print dialog; failures other than cancel are logged.
- `toggleDevTools(tabId)`: detached DevTools.
