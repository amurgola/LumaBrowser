# WatcherForwarder

`core/browser/network/WatcherForwarder.js`

Builds and forwards one webhook payload per matching network watcher for a finished request.

## Methods

- `new WatcherForwarder(watcherService)`.
- `forward(requestInfo, body)`: redacts request and response headers once with
  `HeaderRedactor.redactHeaders`, then calls `watcherService.forwardToWebhook`
  per watcher in `requestInfo.matchingWatchers` (not awaited; results are logged).
  `body` is `{ body, base64Encoded }` or null.
- `WatcherForwarder.buildPayload(requestInfo, watcher, cleanHeaders, body)`:
  `{ url, method, timestamp, request, response: { status, statusText, mimeType } }`;
  `captureHeaders` adds `request.headers` and `response.headers`, `captureBody`
  adds `response.body` and `response.base64Encoded` when a body exists.

## Security

Owner decision 2026-08-05: Cookie, Authorization, Set-Cookie and
Proxy-Authorization never leave the interceptor, with no opt-out. The watcher
service redacts again at its choke point; this keeps raw values out of the
payloads entirely. Never loosen.
