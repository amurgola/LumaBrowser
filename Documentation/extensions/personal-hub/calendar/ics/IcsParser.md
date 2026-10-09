# IcsParser

`extensions/personal-hub/calendar/ics/IcsParser.js`

Parses iCalendar (RFC 5545) text into plain VEVENT records. Dates stay raw
(`{ value, tzid, isDate }`) for [IcsDateTime](IcsDateTime.md) to resolve.

## Methods (static)

- `parse(text)` -> `{ events, timezones }`. Each event:
  `{ uid, summary, description, location, dtstart, dtend, duration, rrule,
  exdates: [], recurrenceId, status (upper-case), url, organizer: { name, email,
  partstat } | null, attendees: [...], lastModified, sequence }`. A VEVENT
  without a UID or DTSTART is dropped. `timezones` lists the VTIMEZONE ids.
- `unfold(text)`: CRLF/LF line ends; a line starting with a space or tab
  continues the previous one.
- `parseLine(line)` -> `{ name, params, value }`; quoted parameter values may
  contain colons and semicolons.
- `unescapeText(value)`: `\n`, `\N`, `\,`, `\;`, `\\`.
- `dateValue(prop)`: `VALUE=DATE` or an 8-digit value marks a date.

## Why

Several EXDATE lines and comma-separated EXDATE values both occur in the wild
(Google emits one per line, Outlook one list), so each date keeps the TZID of
its own line.
