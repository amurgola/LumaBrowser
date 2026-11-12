# ActivityKind

`extensions/personal-hub/inbox/ActivityKind.js`

What sort of thing an activity item is: a chat conversation, a mail, a
calendar notice, a task notice, or anything else. Read from the app that
raised it unless the item says so itself (an automation may push a kind,
which is kept in the item's `context`). The activity feed and the chat's
`@dashboard` text use it to say what each line is.

## Methods (static)

- `CHAT`, `MAIL`, `CALENDAR`, `TASK`, `OTHER` and `ALL` (`chat`, `mail`,
  `calendar`, `task`, `other`).
- `forApp(app)`: the kind of an app name alone, case-insensitive. The `BY_APP`
  table first (slack, teams, messages, discord, whatsapp, telegram -> `chat`;
  gmail, outlook, proton -> `mail`; google-calendar, calendar -> `calendar`;
  clickup -> `task`), then the `HINTS` patterns in order (`calendar`, `meet.`
  or `zoom.` -> `calendar`; `mail` -> `mail`; `chat` or `messag` -> `chat`;
  jira, linear, asana, trello, github, gitlab -> `task`), else `other`.
- `of(item)`: `item` is `{ app, context? }`; a valid `context.kind` wins over
  the app, anything else falls back to `forApp(item.app)`.
- `clean(value)`: a known kind trimmed and in lower case, or `''` for
  anything else.

## Why

Apps the [NotificationClassifier](NotificationClassifier.md) has no rule for
are named after their host (`calendar.google.com`), which often says enough,
so the hints read the name instead of a second host table. The kind is worked
out when an item is read ([InboxService](InboxService.md)), never stored,
except for the one an automation sends.
