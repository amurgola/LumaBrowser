# CalendarProvider

`extensions/personal-hub/calendar/CalendarProvider.js`

Base class for the Hub's calendar providers. Each provider turns one calendar
source (its `config`, plus credentials for OAuth kinds) into the occurrences
overlapping a time window, in one shared event shape, so CalendarService and
the agenda never care where a calendar came from.

## Contract

- `static KIND`: the source kind the provider serves (`ics`, `google`, `microsoft`).
- `validateConfig(config)`: an error string the settings UI shows, or null.
- `async fetchEvents(source, { from, to, credentials, fetchImpl })`: resolves
  `[{ uid, title, description, location, startsAt, endsAt, allDay, status, url,
  organizer, attendees: [{ name, email }] }]` for occurrences overlapping
  `[from, to)`. `startsAt` / `endsAt` are UTC ISO strings; an all-day event is
  anchored at local midnight. `credentials` is `{ accessToken }` for OAuth kinds.
- `needsOAuth()`: false by default; Google and Microsoft return true.
- `static clipWindow(events, from, to)`: keeps the events overlapping the
  window (a zero-length event counts when its start is inside).

Unimplemented methods throw, so a half-written provider fails at first use.

## Implementations

[IcsCalendarProvider](providers/IcsCalendarProvider.md),
[GoogleCalendarProvider](providers/GoogleCalendarProvider.md),
[MicrosoftCalendarProvider](providers/MicrosoftCalendarProvider.md).
