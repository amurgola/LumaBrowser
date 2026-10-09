# NotificationService

`extensions/notification-interceptor/NotificationService.js`

Keeps the webhook URL, records each intercepted notification with its forward
outcome, forwards it when a webhook is set, and announces every ingested
notification (an EventEmitter) so other extensions, the Hub's conversation
queue first, hear them.

## Methods

- `new NotificationService({ db, logStore?, forwarder?, now? })`: `db` is the
  raw SettingsDatabase.
- `getWebhookUrl()` / `setWebhookUrl(url)`: the unprefixed legacy key
  `webhookUrl` (older profiles keep their webhook; the wizard reads the same key).
- `ingest(notification)`: builds the entry `{ id: 'ntf_...', at, source, title,
  body, url, tabTitle, forward, error }` with `forward` `sent`, `skipped` (no
  webhook) or `failed` (with `error`), records it and resolves `{ success:
  forward !== 'failed', entry, count }`.
- `forward(notification)`: forward only, no log entry. `{ success: false,
  error: 'No webhook URL configured' }`, `{ success: true, response }` or
  `{ success: false, error }`.
- `getLog()` -> `{ entries, count }`; `clearLog()`; `entries()`; `count()`.
- `onIngest(cb)`: `cb({ notification, entry })` after every `ingest`, webhook
  or not; returns the unsubscribe. A throwing listener never breaks ingest.
  (`INGESTED_EVENT` = `'ingested'` on the emitter.)

## Why

A failed forward is still logged, so the settings page shows what was captured
and where it went even when the receiver is down.
