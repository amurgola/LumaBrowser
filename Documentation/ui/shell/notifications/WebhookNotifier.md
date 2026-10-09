# WebhookNotifier

`ui/shell/notifications/WebhookNotifier.js`

The fallback `window.handleNotification` (log, then forward when a webhook URL is known) and `window.updateWebhookStatus`, until notification-interceptor takes over.

## Methods

- `install()`, `handle(data, tabId)`, `updateStatus(url)`, `webhookUrl`.

## Globals

Reads `window.electronAPI.onSettingsLoaded`, `forwardNotification`.
