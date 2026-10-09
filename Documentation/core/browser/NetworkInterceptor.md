# NetworkInterceptor

`core/browser/NetworkInterceptor.js`

Watches each tab's network traffic over its shared DevTools debugger. Feeds
the per-tab [RequestLog](network/RequestLog.md) and hands requests matching a
network watcher to [WatcherForwarder](network/WatcherForwarder.md).

## Methods

- `new NetworkInterceptor(networkWatcherService)`. Subscribes to
  `watcherService.onChange` (when present) to re-sync Fetch interception.
- `attachToWebContents(webContents, tabId)`: once per WebContents. Records
  `tabId -> webContents.id` first, shares an already-attached debugger (the
  identity override attaches first) or attaches one, enables `Network` (10 MB
  per resource, 100 MB total buffers) and, only when wanted, `Fetch`. Failures
  are logged, never thrown.
- `syncFetchInterception()`: enables or disables `Fetch` on every attached tab
  to match the watcher set; per-tab failures are warned and retried next sync.
- `getRequestLog(tabId)` / `getAllRequestLogs()`: see RequestLog. Unknown tabs get `[]`.
- `detachAll()`: detaches every debugger and clears state (app quit).
- `activeDebuggers`: `webContentsId -> { webContents, attached, fetchEnabled }`.

## Flow per request

1. `Network.requestWillBeSent`: logged (url and method only); if
   `findMatchingWatchers(url, method)` is non-empty the request is kept pending.
2. `Network.responseReceived`: status recorded in the log; status and headers kept on the pending request.
3. `Fetch.requestPaused` (only while Fetch is on): the pending request is
   found by `networkId`, else by URL; if a watcher wants the body,
   `Fetch.getResponseBody` stores it. The request is ALWAYS continued, even after errors.
4. `Network.loadingFinished`: the body is the Fetch-captured one, else
   `Network.getResponseBody` when a watcher wants it; WatcherForwarder sends one
   payload per watcher. `Network.loadingFailed` drops the pending request.

If another client detaches the shared debugger while the tab lives, the domains
are re-enabled on the next tick without doubling listeners. On `destroyed` only
our own records are dropped (touching the debugger then throws and stalls the close).

## Why Fetch is opt-in

Response-stage Fetch interception on every tab put the browser process on a
Chromium use-after-free that closes the whole app with no dialog and nothing on
stderr (reproduced 2026-09-12, Electron 43.3.0 / Chromium 150.0.7871.212):
`InterceptionJob::OnComplete` for a request that failed before any response
(a tab reloading, closing or being restored with POSTs in flight) re-enters
`NotifyClient`, and with the DevTools client gone the job is freed inside
`RequestBodyCollector::Collect`'s synchronous callback (fault
`electron.exe+0x4B37F38`). That path exists only when the Response stage is
intercepted, so Fetch stays off unless an ENABLED watcher has `captureBody`.

## Security

Credential headers are redacted by WatcherForwarder before any payload is
built; the request log never holds headers or bodies. Neither may be loosened.
