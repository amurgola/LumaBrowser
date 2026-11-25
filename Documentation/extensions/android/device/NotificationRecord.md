# NotificationRecord

`extensions/android/device/NotificationRecord.js`

Reads one notification out of what `cmd notification get <key>` prints.

## Methods

- `NotificationRecord.parse(key, record)` -> `{ key, packageName, title, text, postedAtMs }`; the long text wins over the short one.
- `NotificationRecord.keysIn(listing)`: the keys in `cmd notification list` output (`user|package|id|tag|uid`).
