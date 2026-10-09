# MicrosoftSessionCalendarProvider

`extensions/personal-hub/calendar/providers/MicrosoftSessionCalendarProvider.js`

The `microsoft-session` calendar kind: a Microsoft 365 calendar read through a
persisted Teams or Outlook tab. The Graph token comes from the tab's own
sign-in ([MicrosoftAccounts](../../connections/MicrosoftAccounts.md)`.token`
with `reload: false`, so a lapsed token wakes the tab but never reloads it from
a sync), and the events through the same Graph calendarView as
[MicrosoftCalendarProvider](MicrosoftCalendarProvider.md). No OAuth app.

## Methods

- `new MicrosoftSessionCalendarProvider({ getToken, graph? })`: `getToken(partition)`.
- `validateConfig(config)`: needs `partition`; `calendarId` optional (the
  default calendar otherwise).
- `fetchEvents(source, { from, to, fetchImpl })`: a refused token (HTTP 401)
  becomes "sign in again in the Teams or Outlook tab"; a missing token passes
  the token's own error on.
