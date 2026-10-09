# NetworkWatcherService

`core/network-watcher/NetworkWatcherService.js`

Keeps the [NetworkWatcher](NetworkWatcher.md) list in memory, backed by the
SettingsDatabase watcher table, and forwards captures to webhooks. It is the
redaction choke point for everything a watcher persists or sends.

## Methods

- `new NetworkWatcherService(db)`: `db` is the SettingsDatabase
  (`getAllWatchers`, `hasWatcher`, `addWatcher`, `updateWatcher`,
  `removeWatcher`). Loads every stored watcher; a row that fails validation
  is logged and skipped.
- `onChange(listener)` subscribes to add, update and confirmed remove; returns
  an unsubscribe function. A throwing listener is logged and the rest still run.
- `wantsBodyCapture()` is true while at least one enabled watcher has
  `captureBody`.
- `addWatcher(config)` throws `A watcher for pattern "<p>" with method "<m>"
  already exists` when the pair is taken (method defaults to `*`), or the
  model's validation error; otherwise stores and returns the watcher.
- `updateWatcher(id, updates)` rebuilds the watcher from its JSON plus the
  patch (the id cannot change), stores it and returns it; `null` for an
  unknown id.
- `removeWatcher(id)` returns the db's answer and only drops the watcher from
  memory when it is true.
- `setWatcherEnabled(id, enabled)` is `updateWatcher(id, { enabled })`.
- `getWatcher(id)`, `getAllWatchers()`, `findMatchingWatchers(url, method = 'GET')`.
- `forwardToWebhook(watcher, requestData)` never rejects. It builds
  `{ watcherId, note, timestamp, request: <redacted capture> }`, records it
  (`lastCapturedResponse`, trigger count and time, in memory and in the db)
  and then posts it through [WatcherWebhook](WatcherWebhook.md) when the
  watcher has `sendTo`. Replies `{ success, forwarded, status, statusText }`,
  `{ success: true, forwarded: false, message }` without a webhook, or
  `{ success: false, forwarded: false, error }`.
- `getStats()` returns `{ total, enabled, disabled, totalTriggers }`.

## Why

Security control: [HeaderRedactor](HeaderRedactor.md) runs here on every
capture, so Cookie, Authorization, Set-Cookie and Proxy-Authorization are never
persisted or forwarded, whichever caller built the capture (the interceptor
redacts too, but the test-webhook routes build captures themselves). There is
no opt-out and the tests pinning it must never be loosened.

A watcher without a webhook is not inert: it still records the redacted
capture, which is readable over REST. The trigger is recorded before the post
so a permanently failing webhook still shows the user that it matches.
`forwardToWebhook` resolves instead of rejecting because the interceptor calls
it fire-and-forget.
