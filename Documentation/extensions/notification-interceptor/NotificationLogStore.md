# NotificationLogStore

`extensions/notification-interceptor/NotificationLogStore.js`

Persists the recent notification log (newest first, at most `LOG_LIMIT` = 50)
and the running total of notifications seen. Extends
[SettingsValueStore](../../core/database/SettingsValueStore.md) and runs its
contract test.

## Methods

- `new NotificationLogStore(rawDb)`.
- `entries()`: the log array; a missing or corrupt value reads as `[]`. A log
  stored as a JSON string by older builds is parsed.
- `record(entry)`: prepends the entry, trims to the limit, increments the count.
- `count()`: the total (a non-numeric value reads as 0); `clear()` empties both.
- Statics: `STORAGE_KEY` (`ext.notification-interceptor.log`), `COUNT_KEY`
  (`ext.notification-interceptor.count`), `LOG_LIMIT`.

## Why

The keys are raw (not namespaced through `context.db`) and must stay exactly
as legacy wrote them so existing logs survive. The count keeps growing past the
log limit: it is "notifications seen", not "entries kept".
