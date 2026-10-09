# IcsCalendarProvider

`extensions/personal-hub/calendar/providers/IcsCalendarProvider.js`

The ICS feed provider (`KIND = 'ics'`): downloads a calendar's private iCal
address (Google Calendar's "secret address in iCal format", an Outlook
published calendar, a Proton share link) and expands it into the occurrences
inside the sync window. Read-only, no sign-in; the zero-config path that
covers every calendar the Hub supports.

## Methods

- `validateConfig({ url })`: an http(s) or `webcal://` URL is required.
- `static normalizeUrl(raw)`: `webcal://` becomes `https://`; a Google Calendar embed link, share link or bare id (see [GoogleCalendarId](../GoogleCalendarId.md)) becomes the calendar's public iCal address, which works when the calendar's sharing is public.
- `async fetchEvents(source, { from, to, fetchImpl })`: downloads (20 s
  timeout, 10 MB cap, `User-Agent: LumaBrowser Hub`), parses with
  [IcsParser](../ics/IcsParser.md), expands with
  [RecurrenceExpander](../ics/RecurrenceExpander.md), clips to the window.
- `static expandAll(vevents, { from, to })`: groups VEVENTs by UID into a master
  plus RECURRENCE-ID overrides and expands each chain. A CANCELLED master drops
  the whole series; a CANCELLED occurrence drops only itself. Overrides without
  a master are single events.
- `static toEvent(occurrence)`: the shared event shape; `organizer` is the
  email, else the CN; `status` is lower-cased (`confirmed` by default).

## Why

Occurrences keep the master's UID: the `hub_calendar_events` unique index is
`(source_id, uid, starts_at)`, so a series stores one row per occurrence.
