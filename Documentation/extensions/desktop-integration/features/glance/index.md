# glance feature

`extensions/desktop-integration/features/glance/index.js`

A Desktop Integration feature module (contract in the
[README](../../README.md#5-feature-modules)): a compact, display-ready summary
of the Hub for tiny desktop surfaces (a taskbar clock, a tray tooltip, a status
bar), and a way to jump from it into Luma. On by default. Built by
[GlanceService](GlanceService.md) from [GlanceProviders](GlanceProviders.md);
opening is [GlanceOpener](GlanceOpener.md). The Windhawk client is
[luma-taskbar-glance](../../../../integrations/windhawk/luma-taskbar-glance.wh.md).

## Routes (token required)

### `GET /api/desktop/glance/`

```json
{
  "success": true,
  "generatedAt": "2026-10-23T14:00:00.000Z",
  "ttlSeconds": 30,
  "line": "Standup in 30m · 4 unread · 2 due",
  "lines": [
    { "id": "event:e1", "icon": "calendar", "text": "Standup in 30m", "detail": "Zoom / Work", "url": "https://..." },
    { "id": "queue", "icon": "inbox", "text": "4 unread", "detail": "Teams: Bob" },
    { "id": "tasks", "icon": "task", "text": "2 due", "detail": "1 overdue", "url": "https://..." },
    { "id": "running", "icon": "clock", "text": "1 running", "detail": "Morning digest" }
  ],
  "tooltip": "Luma\nNext: Standup at 10:30am, Zoom\nQueue: 4 open threads\n  Teams: Bob\n...",
  "items": {
    "currentEvent": null,
    "nextEvent": { "id", "title", "startsAt", "endsAt", "inProgress", "location", "url", "source" },
    "unreadCount": 4,
    "latestThread": { "id", "app", "title", "lastAt", "url" },
    "dueTasks": { "count": 2, "overdue": 1, "today": 1, "tasks": [{ "id", "title", "dueAt", "overdue", "url" }] },
    "runningJobs": [{ "id", "name" }]
  },
  "providers": [{ "id": "calendar", "enabled": true, "available": true, "error?": "..." }]
}
```

(`·` is the middle dot, the default separator.)

- `line`: one short line, at most the `maxLineLength` setting; titles shrink
  first, then the line is clipped with `...`. Empty when there is nothing to
  show (and the `emptyText` setting is empty): a client then shows its own
  default.
- `lines`: one entry per provider that has something; `id` is stable per
  provider (`event:<id>` for the event).
- `tooltip`: plain text, `\n` separated, empty when there is nothing.
- `items`: the raw facts; a key is null when its provider is off or its
  extension is missing.
- `ttlSeconds`: the suggested poll interval. The summary is cached for 10
  seconds; `?fresh=1` skips the cache.
- `?format=text` answers the `line` as `text/plain`; `?format=tooltip` the
  `tooltip`.

### `POST /api/desktop/glance/open`

Body `{ target: 'hub' | 'event' | 'thread' | 'task', id? }` (no body: `hub`).
Brings Luma's main window to the front, then:

- `hub`: opens (or re-activates) the Dashboard tab, where the Hub's agenda,
  board and queue widgets live.
- `event` / `thread` / `task`: the item's link (meeting, chat thread, ClickUp
  task) in a new tab; an item without a link opens the Dashboard. Without `id`,
  the item the glance shows now (current or next event, newest open thread,
  first task due).

Answers `{ success: true, target, opened: 'url' | 'dashboard', focused, id?, url? }`;
`400` for an unknown target, `404` for an unknown id, `503` when the Dashboard
or the browser is not available. Call `AllowSetForegroundWindow(<handshake pid>)`
first so the window can really take the focus.

## Settings (settingsSchema)

| Key | Type | Default | What |
| --- | --- | --- | --- |
| `showCalendar` | bool | true | the event in progress, else the next within 24 h |
| `showQueue` | bool | true | open threads in the conversation queue |
| `showTasks` | bool | true | board tasks due today or overdue |
| `showRunning` | bool | true | timed tasks running now |
| `showJobs` | bool | true | job progress from the jobs feature (renders, downloads, chat replies) |
| `maxLineLength` | number | 48 | 8 to 200 characters |
| `timeFormat` | select | `12h` | `12h` (2:30pm) or `24h` (14:30) |
| `separator` | text | ` · ` | between the parts of the line |
| `emptyText` | text | empty | the line when nothing is due |

`onSettingsChanged` drops the cached summary.
