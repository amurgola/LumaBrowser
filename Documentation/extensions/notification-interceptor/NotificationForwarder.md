# NotificationForwarder

`extensions/notification-interceptor/NotificationForwarder.js`

Posts one intercepted web notification to the webhook.

## Methods

- `new NotificationForwarder({ post?, now? })`: `post` defaults to `axios.post`.
- `forward(webhookUrl, notification)`: posts `payloadFor(notification)` as JSON
  with a 10 s timeout; resolves the response body, rejects on any error.
- `payloadFor(notification)`: `{ timestamp, source, title, body, icon, badge,
  tag, requireInteraction, silent, data, url, tabId, tabTitle }`.
