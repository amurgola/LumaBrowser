# WatcherWebhook

`core/network-watcher/WatcherWebhook.js`

Posts one network-watcher capture to a webhook and shapes the replies
[NetworkWatcherService](NetworkWatcherService.md)`.forwardToWebhook` returns.

## Methods

- `WatcherWebhook.post(url, payload)` posts JSON with `Content-Type:
  application/json`, `User-Agent: NotificationWebhookBrowser/1.0` and a 10 s
  timeout; resolves `{ success: true, forwarded: true, status, statusText }`
  and rejects on any network or HTTP error.
- `WatcherWebhook.notForwarded()` is the no-webhook reply.
- `WatcherWebhook.failed(error)` is `{ success: false, forwarded: false, error: error.message }`.
- `WatcherWebhook.TIMEOUT_MS`, `WatcherWebhook.USER_AGENT`.

## Why

The User-Agent still carries the app's original name. It is kept unchanged so
existing webhook receivers see exactly the request they saw before; renaming it
is a product decision, not a refactor.
