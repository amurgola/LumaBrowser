# RequestLog

`core/browser/network/RequestLog.js`

Per-tab ring buffer of recent requests, the data behind MCP `browser_get_network`
and `GET /api/browser/tabs/:id/network`.

## Methods

- `new RequestLog(limit = 100)`; `RequestLog.DEFAULT_LIMIT` is 100 per WebContents.
- `mapTab(tabId, webContentsId)`: records which WebContents backs a tab
  (string/number tab ids are equivalent); null/undefined tab ids are ignored.
- `add(webContentsId, requestId, { url, method })`: appends `{ url, method,
  timestamp, response: null }`, dropping the oldest past the limit.
- `recordResponse(webContentsId, requestId, response)`: sets `{ status,
  statusText, mimeType }` on the newest entry with that request id.
- `forTab(tabId)`: that tab's entries oldest first, without request ids; `[]`
  for an unknown tab.
- `all()`: every tab merged, oldest first.
- `forget(webContentsId)`: drops the log and every tab mapped to it.
- `clearTabMappings()`.

## Why

The log must never hold headers or bodies: that boundary keeps captured
credentials off the MCP path, so fields are picked here rather than trusted
from the caller. `forTab` fails closed, because answering an unknown tab with
everything handed an agent the URLs of every open tab (a legacy bug).
Forgetting on destroy stops a recycled tab id from answering with an old tab's traffic.
