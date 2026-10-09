# InboxService

`extensions/personal-hub/inbox/InboxService.js`

The conversation queue: every intercepted notification is logged in full
(`hub_notifications`) and rolled up into one thread per `(app, threadKey)`
(`hub_threads`); automations (n8n) enrich or add threads; the user works the
queue by state. Emits `thread.changed` after every write.

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
  union; a `reviewed` or `done` thread reopens, a snooze that ran out ends)
  and returns `{ duplicate: false, notification, thread }`. Every
  `pruneEvery` ingests drops notifications older than `retentionDays`.
- `listThreads({ state = 'open', app?, limit = 100, offset = 0 })`: newest
  activity first, each with `lastNotification: { title, body, receivedAt,
  sender }`. `state: 'open'` includes snoozed threads whose snooze passed;
  `'all'` lists every state.
- `getThread(id)` -> `{ thread, notifications }` or `null`.
- `setThreadState(id, state, { snoozeUntil? })`: `open | reviewed | snoozed |
  done`; snoozing needs a future ISO time (default now + 4 h); other states
  clear the snooze. Throws on an unknown state; `null` for an unknown thread.
- `enrichThread(ref, enrichment)`: `ref` `{ id }` or `{ app, threadKey }`;
  `enrichment` `{ title, summary, priority, labels, context, participants,
  url, taskId, state }`. Only the sent fields change; `context` is merged,
  `participants` unioned. Creates the thread (count 0) when an automation
  knows it before any notification. Throws on an unknown priority or state.
- `pushItem({ app, threadKey?, title, summary, priority, participants, url, labels, context, body, sender, at })`:
  a queue item the automation found itself; the thread is touched like an
  ingest and a notification row with host `automation` is stored (`body`
  defaults to `summary`). Returns `{ thread, notification }`.
- `linkToTask(threadId, taskId | null)`.
- `listNotifications({ limit, offset, app, since })` (the raw log, newest
  first; `since` an ISO time, received at or after), `counts()` (threads by
  state).

## Events

`thread.changed` `{ threadId, reason }` with reason `notification`, `state`,
`enriched`, `pushed` or `task`.

## Wiring

In activate, when the notification-interceptor is active:
`context.extensions['notification-interceptor'].onIngest(({ notification }) => inbox.ingest(notification))`
and keep the returned unsubscribe for deactivate.

## Why

The notification-interceptor keeps fifty entries for its settings page; the
queue needs the whole history, grouped the way the user thinks about it
(per conversation, not per ping), and a place for an automation to hang its
summary and priority.
