# NotificationLogMarkup

`extensions/notification-interceptor/ui/NotificationLogMarkup.js`

The HTML of the Notifications tab's recent-notifications list. Every value is
escaped with HtmlEscaper.escape.

## Methods

- `NotificationLogMarkup.list(entries)`: the cards joined, or `EMPTY_HTML`
  (`No notifications captured yet. They appear here as sites send them.`).
- `NotificationLogMarkup.card(entry)`: a `.luma-card.ni-entry` with a status
  dot, the title (`(no title)` when missing), a status badge, the body when
  present, a meta line `Tab title (source) · <TimeText.formatTime(at)>` and
  the error when present.
- `dot(entry)` / `badge(entry)` / `label(entry)`: by `entry.forward`:
  `sent` -> `ok` / `ok` / `Forwarded`; `failed` -> `bad` / `bad` /
  `Forward failed`; otherwise `''` / `muted` / `Not forwarded`.

## Globals

None.
