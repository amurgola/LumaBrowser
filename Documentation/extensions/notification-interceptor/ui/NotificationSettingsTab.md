# NotificationSettingsTab

`extensions/notification-interceptor/ui/NotificationSettingsTab.js`

The Notifications settings tab: webhook URL (autosaved), a "Send a test"
button, the forwarding status line and the recent-notifications list with
each entry's forward status.

## Methods

- `activate(context)`: registers the `settings-tab` slot
  (`notification-interceptor`, label `Notifications`, tabId `notifications`,
  reloading on tab activation) through `context.slotManager`, binds the
  controls when a container came back, then `load()`s.
- `deactivate()`: clears the test-result timer, the container and the entries.
- `load()`: the webhook URL (never overwriting the field while it has focus)
  and status line, then the log (`{ entries, count }`).
- `addIngested(result)`: takes an `ingest` result `{ count, entry }`; the
  count is the result's or the old one plus one, the entry goes first, 50 are
  kept, and the list re-renders.
- `invoke(channel, ...args)`: `ext.notification-interceptor.<channel>` over
  the IPC bridge (the capture hook uses it for `ingest`).
- `count` (getter): the captured-notification count.

Behaviour: the URL saves (trimmed) 500 ms after typing stops and on change,
only when it differs from the stored one; it then flashes
[SavedBadge](../../ui-kit/ui/SavedBadge.md) and calls
`window.updateWebhookStatus(url)`. The status reads `Forwarding to <host>`
(`configured` when the URL does not parse) or
`Webhook: not configured. Notifications are logged but not forwarded.`.
"Send a test" without a URL says `Enter a webhook URL first.`; otherwise it
shows `Sending`, then `Test payload delivered.` (green), `Test failed: <error>`
or `Test failed.` (red), cleared after 6 s. Clear asks
`Clear the notification log?` through Dialogs.confirm, then clears and
reloads. List markup: [NotificationLogMarkup](NotificationLogMarkup.md).

## IPC

`getWebhookUrl`, `saveWebhookUrl(url)`, `testWebhook(url)`, `getLog`,
`clearLog`, `ingest(notification)` under `ext.notification-interceptor.`.

## Globals

Reads `window.updateWebhookStatus` (shell, optional), `window.LumaModal`
through Dialogs, `document.activeElement`.
