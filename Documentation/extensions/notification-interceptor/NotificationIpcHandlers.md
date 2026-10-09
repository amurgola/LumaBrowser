# NotificationIpcHandlers

`extensions/notification-interceptor/NotificationIpcHandlers.js`

IPC controller of the Notifications extension. Channels (all
`ext.notification-interceptor.*`):

| Channel | Reply |
|---|---|
| `saveWebhookUrl(url)` | `{ success: true }` |
| `getWebhookUrl()` | the URL string (raw, not enveloped) |
| `ingest(notification)` | `{ success, entry, count }` |
| `getLog()` | `{ entries, count }` |
| `clearLog()` | `{ success: true }` |
| `forwardNotification(notification)` | `{ success, response? , error? }` |
| `testWebhook(url)` | `{ success, status, response }` or `{ success: false, error }` |

## Methods

- `NotificationIpcHandlers.register(ipc, service, tester?)`: `tester` defaults
  to the core [WebhookTester](../../core/shell/settings/WebhookTester.md).
