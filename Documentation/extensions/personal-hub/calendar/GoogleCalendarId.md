# GoogleCalendarId

`extensions/personal-hub/calendar/GoogleCalendarId.js`

Reads a Google Calendar id out of whatever the user pastes and builds the
calendar's public iCal address from it. Google only hands out the private
iCal address for calendars whose sharing allows it; many shared or Workspace
group calendars only offer an embed link, which still carries the id.

## Methods (static)

- `fromInput(text)`: the id from an embed link (`?src=`, `%40` decoded), a
  share link (`?cid=` base64), a private or public iCal address
  (`/calendar/ical/<id>/...`, `webcal://` accepted), or a bare id such as
  `...@group.calendar.google.com` (a `#` is allowed, as in
  `en.usa#holiday@group.v.calendar.google.com`); null otherwise.
- `isGoogleLink(text)`: a Google Calendar link or id that is not already a
  feed URL (those are used as they are).
- `publicIcsUrl(calendarId)`: `https://calendar.google.com/calendar/ical/<id>/public/basic.ics`.

Used by [IcsCalendarProvider](providers/IcsCalendarProvider.md) (an embed
link as an ICS source) and
[GoogleSessionCalendarProvider](providers/GoogleSessionCalendarProvider.md).
