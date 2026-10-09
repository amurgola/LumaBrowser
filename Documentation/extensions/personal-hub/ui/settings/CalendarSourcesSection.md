# CalendarSourcesSection

`extensions/personal-hub/ui/settings/CalendarSourcesSection.js`

The Hub settings tab's calendars: the list of calendar sources with their
sync state and actions, and the by-hand add form (`Add a calendar by hand`)
for an ICS feed, a pasted Google Calendar link read through the signed-in
browser, a Google Calendar over an OAuth app, or a Microsoft 365 calendar over
an OAuth app. Calendars of signed-in Google and Microsoft tabs are ticked under
[Connections](ConnectionsSection.md) instead; `microsoft-session` is listed
(label only, `manual: false`) but not offered in the form.

## Behaviour

- The list shows one row per source: status dot
  ([SourceStatus](SourceStatus.md)), colour swatch, label, kind badge, the
  account badge of a session source (`config.account`), event count, and the actions `Connect` (google/microsoft sources that are not
  `connected`), `Sync now` (`syncNow { kind: 'calendar', sourceId }`) and
  `Remove` (confirms `Remove this calendar and its synced events?`).
- The add form switches its fields by kind (`data-kind` groups): ICS shows the
  URL field with the help text `ICS_HELP`; `google-session` shows the pasted
  calendar link or id and an optional Google account number (`authUser`), no
  sign-in (`NO_SIGN_IN_KINDS` = ics, google-session, microsoft-session); Google and Microsoft show client
  id, client secret, calendar id (optional) and the redirect URI to register
  (from `setCallbackUrl`, fed by the automation section); Microsoft adds the
  tenant (default `common`). Interval through
  [IntervalPicker](../../../ui-kit/ui/IntervalPicker.md), default 15 minutes.
- Validation before sending: a label; an `https://` URL for ICS; a calendar
  link for the signed-in kind; a client id for OAuth kinds. Problems go to the tab's notice line.
- `addCalendarSource` payload: `{ kind, label, color, intervalMs, config }`
  with `config` `{ url }` (ics), `{ calendar, authUser? }` (google-session) or
  `{ clientId, clientSecret, calendarId, tenant? }`. After adding an OAuth kind the sign-in starts at once.
- `Connect` calls `startOAuth(sourceId)` (the main side opens the tab) and
  says `Finish signing in in the tab that opened; the calendar syncs once you are back here.`

## Methods

- `setCallbackUrl(url)`: fills the redirect URI line.
- `load()`: `listCalendarSources` -> `{ sources }`.

## IPC

`listCalendarSources`, `addCalendarSource(input)`,
`removeCalendarSource(id)`, `startOAuth(id)`, `syncNow(opts)`.
