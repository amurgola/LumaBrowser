# TabLookup

`core/llm-server/agent/TabLookup.js`

Reads the agent's tab state from the browser service. Every lookup is best-effort.

## Methods

- `new TabLookup(browserService)`.
- `describe(tabId)`: `Tab <id>: <url> (<title or untitled>)` for the tab (or the
  first tab), else `Tab <id>: (unknown)`.
- `currentUrl(tabId)`: that tab's URL (or the first tab's), else null.
- `attachDigest(result, tabId)`: sets `result.pageElements` from
  `browserService.observePage(tabId)`, so the model can act by ref straight away.

`getTabs()` may answer `{ tabs }`, `{ data }` or a bare array.
