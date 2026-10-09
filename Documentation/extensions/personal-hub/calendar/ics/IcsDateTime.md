# IcsDateTime

`extensions/personal-hub/calendar/ics/IcsDateTime.js`

Resolves iCalendar dates and date-times, with an optional TZID (IANA or
Windows), to UTC milliseconds and ISO strings. Zone offsets come from
`Intl.DateTimeFormat`, so no zone database ships with the app.

## Methods (static)

- `toIso(dt)` / `toMs(dt)`: `dt` is `{ value, tzid, isDate }`.
- `parseComponents(value)`: `YYYYMMDD`, `YYYYMMDDTHHMMSS`, `YYYYMMDDTHHMMSSZ`.
- `componentsToMs(components, tzid, isDate)`: a `Z` value is UTC; a date-only
  or floating value is local machine time; a zoned value is converted with one
  refinement step so DST edges resolve.
- `dateOnlyToMs('YYYY-MM-DD' | 'YYYYMMDD')`: local midnight, the anchor every
  Hub all-day event uses (Google and Graph dates go through it too).
- `addLocalDays(ms, n)`: calendar-day arithmetic that survives a DST change.
- `resolveIana(tzid)`: the Windows table (Eastern/Central/Mountain/Pacific
  Standard Time, GMT, W. Europe, Central Europe, Romance, AUS Eastern, India,
  Tokyo, China, Singapore and more), a direct IANA name, or the trailing IANA
  part of a wrapped id such as `/mozilla.org/20050126_1/Europe/Berlin`.
  Null for no TZID (floating); `'UTC'` for a name nothing recognises.
- `isIana(name)`, `zoneOffsetMinutes(iana, utcMs)` (east positive).

## Why

An unknown TZID is read as UTC rather than local: a feed authored elsewhere is
more often wrong by its real offset than by the user's, and UTC is at least
stable across the user's own travel. All-day events anchor to local midnight so
"Friday" is Friday wherever the laptop is.
