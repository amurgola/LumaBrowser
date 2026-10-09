# MicrosoftCalendarProvider

`extensions/personal-hub/calendar/providers/MicrosoftCalendarProvider.js`

The Microsoft 365 provider (`KIND = 'microsoft'`, `needsOAuth()` true): reads
a calendar's occurrences through Microsoft Graph's `calendarView`, which
expands recurrences server-side, asking for all times in UTC.

## Config

`{ clientId (required), tenant ('common' by default), calendarId? }`. The user
registers an Entra app (mobile/desktop platform, loopback redirect) and pastes
its application id; a client secret is optional for public clients.

## Methods

- `validateConfig(config)`: the client id is required.
- `async fetchEvents(source, { from, to, credentials: { accessToken }, fetchImpl })`:
  `GET /me/calendarView` (or `/me/calendars/<id>/calendarView`) with
  `startDateTime`, `endDateTime`, `$top=200`, `$orderby=start/dateTime` and the
  header `Prefer: outlook.timezone="UTC"`, following `@odata.nextLink` (at most
  25 pages). Maps `subject`, `bodyPreview`, `location.displayName`,
  `isAllDay`, `isCancelled` (-> `cancelled`), `webLink`, organizer and
  attendees. Graph's `2026-10-06T09:00:00.0000000` form is trimmed to
  milliseconds and read as UTC.
- `async listCalendars(credentials, fetchImpl)` -> `[{ id, name, primary }]`.
- `static toEvent(item)`.
