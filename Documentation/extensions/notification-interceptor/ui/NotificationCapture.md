# NotificationCapture

`extensions/notification-interceptor/ui/NotificationCapture.js`

Receives every web notification the tabs intercept, records and forwards it
through the main process, and reports it in the shell's activity log.

## Methods

- `new NotificationCapture(settingsTab)`: the
  [NotificationSettingsTab](NotificationSettingsTab.md) that owns the IPC
  channel and shows the list.
- `install(browserRenderer)`: remembers the current `window.handleNotification`
  and replaces it with `receive`.
- `uninstall()`: restores the previous handler, or deletes ours when there was
  none.
- `receive(data, tabId)`: resolves the tab title (`browserRenderer.getTab(id).title`,
  else `Tab <id>`), logs `<tab>: <title>` (info), sends
  `ingest({ ...data, tabId, tabTitle })`, adds the result to the tab, sets
  `#notificationStatus` active and `#notificationStatusText` to
  `Notifications: N captured` when the page has them, then logs
  `<tab>: forwarded to webhook` (success) or `<tab>: webhook error, <error>`
  (error). An ingest failure logs `<tab>: <message>` (error).

## Globals

Writes `window.handleNotification` (the shell's capture hook, an existing
contract; the shell calls it with `(data, tabId)`). Reads
`window.addLogEntry` (shell activity log, optional) and the
`#notificationStatus` / `#notificationStatusText` elements.
