# ConnectionsSection

`extensions/personal-hub/ui/settings/ConnectionsSection.js`

The first section of the Hub settings tab: every persisted tab the Hub reads
through (from `listConnections`), with a status dot (`ok`; `warn` for a
missing tab or a non-Microsoft error; `bad` when it needs attention), the
account(s) it is signed in as, Queue and calendar-count badges, and an Open
tab button. Under a Google or Microsoft row, each account's calendars (from
`listAccountCalendars`) are ticks; ticking calls `setAccountCalendar`.
"Add an account" opens Google Calendar or Teams in a new persisted tab
(`openSignInTab`); "Check now" runs `checkConnections`. The settings tab
reloads it on `connection.changed`.

## Methods

- `dotClass(row)`, `statusText(row)` (static): the row's dot and status line.
