# CalendarEventRepository

`extensions/personal-hub/calendar/CalendarEventRepository.js`

Plain queries over `hub_calendar_events`: the synced occurrences of every
calendar source, replaced wholesale per source on each sync and read back by
time window.

## Methods

- `replaceForSource(sourceId, events)`: deletes the source's rows and inserts
  the new ones in one transaction (a reader never sees a half-synced
  calendar). Events: `{ uid, title, description, location, startsAt, endsAt,
  allDay, status, url, organizer, attendees }`.
- `deleteForSource(sourceId)`, `countForSource(sourceId)`.
- `listBetween(fromIso, toIso, { sourceIds?, limit = 500 })`: events
  overlapping `[from, to)`, soonest first.
- `static hydrate(row)`.
