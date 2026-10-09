# NetworkLogQuery

`core/browser/controller/NetworkLogQuery.js`

Reads a tab's network request log for the REST and MCP surfaces.

## Methods

- `NetworkLogQuery.read(networkInterceptor, tabId, urlFilter?)` returns the
  [NetworkInterceptor](../NetworkInterceptor.md) log for the tab, filtered, or `null` when there is no
  interceptor.
- `NetworkLogQuery.filter(logs, urlFilter)` keeps entries whose `url` contains `urlFilter`; no filter
  returns `logs` as is. Entries without a `url` are skipped.
- `NetworkLogQuery.UNAVAILABLE`: `Network interceptor not available`.
