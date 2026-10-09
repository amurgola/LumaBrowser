# NotificationInterceptorExtension

`extensions/notification-interceptor/NotificationInterceptorExtension.js`

Main-process side of the Notifications extension: web notifications captured
in tabs are logged and forwarded to the user's webhook.

## Methods

- `activate(context)`: builds a [NotificationService](NotificationService.md)
  over `context.db.getRawDb()`, registers
  [NotificationIpcHandlers](NotificationIpcHandlers.md) on `context.ipc` and
  resolves the public API `{ getWebhookUrl(), setWebhookUrl(url), getLog(),
  getCount(), onIngest(cb) }` (`getLog` returns the entry array; `onIngest`
  returns the unsubscribe and is how the Hub extension feeds its
  conversation queue).
- `deactivate()`: drops the service.

## Entry files

- `manifest.js`: id `notification-interceptor`, `loadPriority: 10`, requires
  `core:browser` and `core:database` (settings keys only), settings tab
  `notifications`. Unchanged apart from the purpose header.
- `main.js`: `{ activate, deactivate }` delegating to one instance.
- `renderer.js`: module entry setting `window.__ext_notification_interceptor` over
  [ui/NotificationInterceptorRenderer](ui/NotificationInterceptorRenderer.md).

## The capture contract (for the renderer porter)

The page-side capture is renderer work and is not ported here. The webview
preload must inject the `Notification` override into the page MAIN world (an
isolated-world override never sees the page's `new Notification`). Captured
notifications reach the renderer's `window.handleNotification(data, tabId)`,
which calls `ext.notification-interceptor.ingest` with `{ source, title, body,
icon, badge, tag, requireInteraction, silent, data, url, tabId, tabTitle }`.
The channel names and payloads in NotificationIpcHandlers are the contract and
are unchanged.
