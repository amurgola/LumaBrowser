# GoogleSessionCalendarProvider

`extensions/personal-hub/calendar/providers/GoogleSessionCalendarProvider.js`

The Google Calendar provider (`KIND = 'google-session'`) for calendars
without an iCal address: reads the calendar the way the Calendar web app
does, through Google's Calendar API with the signed-in browser session's
cookies (the persisted Google tab), and falls back to the calendar's public
iCal feed when the session is not signed in. No OAuth client needed.

## Config

`{ calendar, calendarId?, authUser?, partition?, apiKey? }`: `calendar` is
whatever was pasted (embed link, share link, feed address or id, resolved by
[GoogleCalendarId](../GoogleCalendarId.md)); `authUser` picks which of
several signed-in Google accounts the request runs as (0 is the first, as in
`calendar.google.com/calendar/u/1`); `partition` defaults to `persist:main`;
`apiKey` overrides the Calendar embed page's public API key should Google
rotate it.

## Methods

- `new GoogleSessionCalendarProvider({ getCookies?, icsProvider?, now? })`:
  `getCookies` is [SessionCookies](../session/SessionCookies.md)`.reader()`
  in the app.
- `validateConfig(config)`: a resolvable calendar id is required.
- `async fetchEvents(source, { from, to, fetchImpl })`: with a `SAPISID`
  cookie, GET `https://clients6.google.com/calendar/v3/calendars/<id>/events`
  (`singleEvents`, the window, 250 per page, up to 40 pages) with the
  [SapisidHash](../session/SapisidHash.md) Authorization, the session's
  cookies, `Origin: https://calendar.google.com` (never `X-Origin`, which
  makes Google answer "Origin doesn't match Host for XD3") and
  `X-Goog-AuthUser`; items map through `GoogleCalendarProvider.toEvent`. A
  refused session (401 or 403) or no session falls back to the public feed
  through [IcsCalendarProvider](IcsCalendarProvider.md); when that fails too
  the error names the fix (sign in to calendar.google.com in a persisted tab,
  or make the calendar public). Any API error carries Google's own
  `error.message` (else the first line of the body) so a failure says what
  was disliked.

## Why

Google Workspace admins can switch off the private iCal address, and a
calendar shared only inside the domain has no public feed, so the only
remaining door is the one the user already walked through: their signed-in
browser session. Reading it this way needs no Google Cloud project, which is
what the OAuth kind requires.
