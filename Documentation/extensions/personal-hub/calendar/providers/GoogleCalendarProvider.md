# GoogleCalendarProvider

`extensions/personal-hub/calendar/providers/GoogleCalendarProvider.js`

The Google Calendar provider (`KIND = 'google'`, `needsOAuth()` true): reads
one calendar's occurrences through the Calendar API v3 with the source's OAuth
access token. `singleEvents=true` makes Google expand recurrences, so the Hub
never sees RRULEs from this kind.

## Config

`{ clientId (required), calendarId ('primary' by default) }`. The matching
`clientSecret` is held by CalendarService in the secrets store. The user
creates a Google Cloud OAuth client (Desktop app) and pastes its id and secret.

## Methods

- `validateConfig(config)`: the client id is required.
- `async fetchEvents(source, { from, to, credentials: { accessToken }, fetchImpl })`:
  pages through `GET /calendars/<id>/events?singleEvents=true&orderBy=startTime&timeMin&timeMax&maxResults=2500&pageToken`
  (at most 20 pages) and maps items: `date` versus `dateTime` decides
  `allDay`, `iCalUID` is the uid, `htmlLink` the url, organizer email, attendees
  display names and emails.
- `async listCalendars(credentials, fetchImpl)` -> `[{ id, name, primary }]`
  for the settings UI to pick a calendar.
- `static toEvent(item)`.

Missing credentials and non-2xx replies throw (`Google Calendar: HTTP <n>`),
which CalendarService records as the source's last error.
