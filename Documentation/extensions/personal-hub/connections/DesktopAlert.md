# DesktopAlert

`extensions/personal-hub/connections/DesktopAlert.js`

An operating-system notification for a Hub alert, through Electron's
`Notification` (required lazily, as in page-change-detector's notifier).
Shown notifications stay referenced until closed so their click handler lives.

## Methods

- `new DesktopAlert({ electronModule? })`.
- `show({ title, body, onClick? })`: whether a notification was shown (false
  outside Electron or when notifications are unsupported).
