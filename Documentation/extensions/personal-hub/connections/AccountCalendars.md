# AccountCalendars

`extensions/personal-hub/connections/AccountCalendars.js`

Turns the accounts the [ConnectionMonitor](ConnectionMonitor.md) found in the
persisted tabs into ticks: each account's calendars, marked with the calendar
source syncing it, and the tick that adds or removes that source. Google
calendars become `google-session` sources (`config: { calendar, calendarId,
partition, account, authUser? }`), Microsoft ones `microsoft-session` sources
(`config: { partition, account, calendarId, calendarName }`).

## Methods

- `new AccountCalendars({ monitor, calendar })`.
- `list()`: `[{ key, provider, partition, email, authUser, appLabel, title,
  status, detail, tabId, calendars: [{ id, name, color, primary, sourceId }] }]`,
  one per account; runs the first check when none has run.
- `set({ provider, partition, authUser?, email?, calendarId, name?, color?,
  enabled })`: adds the source (it syncs at the next tick) or removes it with
  its events; resolves the updated list.
