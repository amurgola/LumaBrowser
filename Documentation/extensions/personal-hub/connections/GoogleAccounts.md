# GoogleAccounts

`extensions/personal-hub/connections/GoogleAccounts.js`

The Google accounts signed in to one session partition, with their calendars,
read the way the Calendar web app reads them: the partition's cookies and the
[SapisidHash](../calendar/session/SapisidHash.md) header against
`clients6.google.com/calendar/v3/users/me/calendarList` (the embed page's API
key, as in [GoogleSessionCalendarProvider](../calendar/providers/GoogleSessionCalendarProvider.md)).
Account slots (`X-Goog-AuthUser` 0, 1, ...) are asked in turn until Google
answers 401, which is also the signed-out signal.

## Methods

- `new GoogleAccounts({ tabs, fetchImpl?, now? })`: `tabs` is a
  [SessionTabs](SessionTabs.md).
- `probe(partition)`: `{ status: 'ok' | 'signed_out' | 'error', accounts:
  [{ authUser, email, calendars: [{ id, name, color, primary, accessRole }] }],
  error? }`. No `SAPISID` cookie, or a 401 on slot 0, is `signed_out`; any other
  HTTP failure is `error` with the accounts read so far. `MAX_ACCOUNTS` caps the slots.
