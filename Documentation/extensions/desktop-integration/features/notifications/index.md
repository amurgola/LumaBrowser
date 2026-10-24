# notifications feature

`extensions/desktop-integration/features/notifications/index.js`

OS notification relay. A desktop client (the
[luma-notification-relay](../../../../integrations/windhawk/luma-notification-relay.wh.md)
Windhawk mod, a script, any program that can read the notifications the
operating system shows) posts them here and Luma files them in the Personal
Hub's conversation queue, next to the web notifications the
notification-interceptor extension catches. On by default. The work is
[NotificationRelay](NotificationRelay.md); the contract is in the
[README](../../README.md#5-feature-modules).

## Routes (token required)

| Route | What |
| --- | --- |
| `POST /api/desktop/notifications/` | one notification, an array, or `{ notifications: [...] }` (up to 100 per request; more are cut and `truncated: true`) |
| `GET /api/desktop/notifications/recent` | the last relayed items with their status; `?limit` (1 to 200, default 50), `?status` (one status) |
| `GET /api/desktop/notifications/apps` | every app seen, with counts, newest first, for building filters |
| `GET /api/desktop/notifications/config` | the relay settings (lists parsed) plus `hubAvailable`, so a client can skip apps Luma drops anyway |
| `POST /api/desktop/notifications/flush` | sends items buffered while the Hub was away -> `{ flushed, pending, hubAvailable }` |

A notification:

```json
{ "app": "Slack", "appId": "com.squirrel.slack.slack", "title": "#general",
  "body": "Ann: lunch?", "lines": ["#general", "Ann: lunch?"],
  "at": "2026-10-23T11:00:00Z", "tag": "", "group": "", "launchUri": "", "imagePath": "" }
```

`app` (display name) or `appId` (AUMID) is required, and some text (`title`,
`body` or `lines`). `at` is ISO or epoch milliseconds (missing or more than
five minutes ahead: now). Unknown fields are ignored. See
[OsNotification](OsNotification.md).

`POST` answers `200 { success: true, received, truncated, hubAvailable, pending, counts: { relayed, buffered, duplicate, filtered, invalid, error }, results: [{ index, status, id, threadId?, reason?, error? }] }`.
When every item is invalid (or the body is empty) it is `400 { success: false, error, ... }`.

Statuses:

- `relayed`: pushed to the Hub queue (`threadId` is the Hub thread).
- `buffered`: the Hub is not installed or is switched off; kept (up to 100,
  oldest dropped) and pushed on the next request or `flush` once it is back.
  Still a success.
- `duplicate`: same AUMID and tag (and group), or same title and body, within
  the dedupe window.
- `filtered`: `reason` is `denied`, `not-allowed`, `self` (LumaBrowser's own
  notification) or `forwarding-off`.
- `invalid`, `error` (the Hub threw; `error` has its message).

Each `relayed` or `buffered` item (and each buffered item later flushed) is
broadcast as `notifications.relayed` with the recent-row shape.

## Into the Hub

[HubMapper](HubMapper.md) builds the `pushQueueItem` payload: desktop apps the
Hub knows from the web (Slack, Teams, Outlook, WhatsApp, Telegram, Discord,
ClickUp, Proton Mail) get the Hub app key and the Hub's own classifier, so a
toast joins the thread its web notification would. Other apps keep their
display name; the thread key is `<aumid>|group:<group>`, `<aumid>|tag:<tag>`, or
`<aumid>|<normalized title>`. Every item has a `context` with
`source: 'desktop'`, the AUMID, the client, tag, group, launch URI and image
path; `url` is the launch URI when it is http(s). Items from apps the Hub does
not know also carry the label `os-notification`. Known apps send no labels,
because `pushQueueItem` replaces a thread's labels and those threads are
shared with web notifications an automation may have labelled.

## Settings (`settingsSchema`)

| Key | Type | Default | What |
| --- | --- | --- | --- |
| `forwardToHub` | bool | true | off: items only appear in `recent` (status `filtered`, reason `forwarding-off`) |
| `filterMode` | select | `all` | `all` (every app but the blocked) or `allowlist` (only the allowed) |
| `allowApps` | textarea | '' | one pattern per line (or comma separated): display name, AUMID or Hub app key, case-insensitive, `*` wildcard |
| `denyApps` | textarea | '' | same format; always wins |
| `ignoreLuma` | bool | true | skip LumaBrowser's own notifications so they never loop back |
| `dedupeWindowSec` | number 0 to 3600 | 120 | repeat window; 0 turns dedupe off |

Settings are read on every request, so changes apply at once.
`onSettingsChanged('forwardToHub')` flushes the buffer. The apps table is kept
in the feature settings under `appsSeen` (saved five seconds after a change and
on dispose).

## Files

- [NotificationRelay](NotificationRelay.md), [OsNotification](OsNotification.md),
  [AppFilter](AppFilter.md), [HubMapper](HubMapper.md)
