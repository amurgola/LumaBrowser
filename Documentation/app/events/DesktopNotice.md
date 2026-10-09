# DesktopNotice

`app/events/DesktopNotice.js`

A native desktop notification with the app icon, best-effort.

## Methods

- `new DesktopNotice({ Notification, iconPath })`.
- `show({ title, body, onClick? })` returns true when shown; false when the
  platform does not support notifications or anything throws.
