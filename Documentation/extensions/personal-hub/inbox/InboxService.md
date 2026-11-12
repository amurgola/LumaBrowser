# InboxService

`extensions/personal-hub/inbox/InboxService.js`

The activity feed: every intercepted notification (a chat message, a mail, a
calendar or task notice, anything a site raises) is logged in full
(`hub_notifications`) and rolled up into one item per `(app, threadKey)`
(`hub_threads`); automations (n8n) enrich or add items. The feed is context
about the user's day, not a queue: nothing in it is unread or waiting to be
cleared. An item can be dismissed (state `done`) to drop it from the feed, and
new activity brings it back. The older states (`reviewed`, `snoozed`) are
still accepted from automations. Emits `thread.changed` after every write.

## Methods

- `new InboxService({ notifications, threads, emit?, now?, dedupeWindowMs = 60000, retentionDays = 90, pruneEvery = 100 })`:
  `notifications` a [NotificationRepository](NotificationRepository.md),
  `threads` a [ThreadRepository](ThreadRepository.md), `emit(type, payload)`
  the renderer push.
- `ingest(notification, tab?)`: `notification` is the notification-interceptor
  payload `{ source, title, body, icon, tag, data, url, tabId, tabTitle }`,
  `tab` `{ partition, title, url }` when known. Classifies it
  ([NotificationClassifier](NotificationClassifier.md)), dedupes like the
  trigger NotificationSource (`notif:<partition or host>:<tag>`, or a sha1 of
  title, body and minute) inside `dedupeWindowMs` -> `{ duplicate: true }`,
  else stores the row, touches the thread (count, last_at, participants
  union; a dismissed (`done`) or `reviewed` item goes back to `open`, a snooze
  that ran out ends)
  and returns `{ duplicate: false, notification, thread }`. Every
  `pruneEvery` ingests drops notifications older than `retentionDays`.
- `listThreads({ state = 'active', app?, since?, limit = 100, offset = 0 })`:
  the feed's items, newest activity first, each with its `kind`
  ([ActivityKind](ActivityKind.md)`.of`: chat, mail, calendar, task or other)
  and `lastNotification: { title, body, receivedAt, sender, partition, host,
  url }` (null when the item has none; all of them come from one
  [NotificationRepository](NotificationRepository.md)`.latestForThreads`
  query). `partition`, `host` and `url` say where the notification came
  from, which is what files the item under a context
  ([ContextService](../context/ContextService.md)`.forItem`). `state`: `active` is everything not dismissed and not snoozed into
  the future, `done` the dismissed items, `all` every item; the legacy states
  still work (`open` includes snoozed items whose snooze passed). `since` (an
  ISO time) keeps items with activity at or after it.
- `getThread(id)` -> `{ thread, notifications }` (the thread with its `kind`)
  or `null`.
- `setThreadState(id, state, { snoozeUntil? })`: `done` dismisses an item,
  `open` restores it; `reviewed` and `snoozed` are still accepted. Snoozing
  needs a future ISO time (default now + 4 h); other states clear the snooze.
  Throws on an unknown state; `null` for an unknown thread.
- `enrichThread(ref, enrichment)`: `ref` `{ id }` or `{ app, threadKey }`;
  `enrichment` `{ title, summary, priority, labels, kind, context,
  participants, url, taskId, state }`. Only the sent fields change; `context`
  is merged, `participants` unioned, and a `kind` is stored as `context.kind`.
  Creates the item (count 0) when an automation knows it before any
  notification. Throws on an unknown priority, kind or state.
- `pushItem({ app, threadKey?, title, summary, priority, participants, url, labels, kind, context, body, sender, at })`:
  a feed item the automation found itself (a mail digest, a calendar notice); the thread is touched like an
  ingest and a notification row with host `automation` is stored (`body`
  defaults to `summary`). Returns `{ thread, notification }`.
- `linkToTask(threadId, taskId | null)`.
- `listNotifications({ limit, offset, app, since })` (the raw log, newest
  first; `since` an ISO time, received at or after), `counts()` (threads by
  state).

## Events

`thread.changed` `{ threadId, reason }` with reason `notification`, `state`,
`enriched`, `pushed` or `task`. For `notification` and `pushed` the payload
also carries `notificationId`, the notification that just reached the item,
which is how [PersonalHubExtension](../PersonalHubExtension.md) notes its
sender as a person ([ContactService](../contacts/ContactService.md)).

## Wiring

In activate, when the notification-interceptor is active:
`context.extensions['notification-interceptor'].onIngest(({ notification }) => inbox.ingest(notification, tab))`
and keep the returned unsubscribe for deactivate. `tab` is the persisted tab
the notification names ([PersonalHubExtension](../PersonalHubExtension.md)`._tabOf`),
so its partition is stored with the notification.

## Why

The notification-interceptor keeps fifty entries for its settings page; the
activity feed needs the whole history, grouped the way the user thinks about it
(per conversation, not per ping), and a place for an automation to hang its
summary and priority.
