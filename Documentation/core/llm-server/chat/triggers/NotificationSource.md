# NotificationSource

`core/llm-server/chat/triggers/NotificationSource.js`

Intercepted web notifications as a trigger source. Extends
[TriggerSource](TriggerSource.md) with `KIND = 'notification'`.

## Methods

- `new NotificationSource({ triggerStore, runner, getTabViewManager, settingsDb? })`.
  `emitEvent` is accepted by callers but unused.
- `ensureSubscribed()`, `stop()`, `upstream()` as in the base; the upstream is the
  TabViewManager and the event is its `'notification'` event.
- `onNotification(payload)` shapes `payload.notificationData || payload` with
  `payload.tab` and delivers it to every notification trigger in scope; returns
  the deliveries.
- `listTabs()` returns persisted tabs a trigger can be scoped to:
  `[{ partition, title, url, host, tabId, hidden, live }]`, live keep-alive tabs
  first, then entries from the settings key `core.browser.persistedTabs` (array
  or JSON string) not restored yet (`tabId: null, hidden: true, live: false`).
- `getTab(partition)` returns one of those or `null`.
- `NotificationSource.matches(source, event)`: a trigger's `source` needs `host`
  and/or `tabPartition`; `host` is a suffix match ignoring `www.`, `tabPartition`
  is exact, and both must hold when both are set.
- `NotificationSource.eventFor(notification, tab)` returns `{ receivedAt, event:
  'notification', title, body, tag, data, icon, url, host, tab }`. Body is capped
  at 4000 characters, title and icon at 500, tag at 200 (an ellipsis marks a cut);
  `data` larger than 4000 characters of JSON becomes `{ truncated: true }`. `url`
  falls back to the tab's url; `host` comes from the url, else the notification's
  `source`. `tab` is `{ id, partition, title, persisted }`.
- `NotificationSource.syntheticEvent(sample)`: a pasted sample. Plain text is the
  body; a string starting with `{` that parses, or an object, is the notification
  (its `tab.persisted` is honoured). Marked `synthetic: true`.
- `NotificationSource.dedupeKeyFor(event)`: `notif:<scope>:<tag>` when the site
  set a tag, else `notif:<scope>:<sha1(title, body, minute)>`, scoped to the tab
  partition or the host.

## Why

Every `new Notification()` a site raises in a tab is caught by the webview
preload (main-world override) and reaches TabViewManager over IPC; the manager
re-emits it with the tab it came from.

At least one of host or tab is required so a trigger never listens to every
notification in the browser. The tab partition is stable across restarts; its
title and url ride along for display. The trigger's pre-filter then narrows on
the text, e.g. `{ "body": { "regex": "hey andyai", "flags": "i" } }`.

Sites that re-raise the same notification (Slack does on every focus change)
carry a tag; without one, an identical title and body within the same minute
count as one delivery.
