# DateFormatter

`core/browser/widgets/DateFormatter.js`

Turns the caller's ISO date into what a date field wants, native or masked/free-text.

## Methods

- `DateFormatter.parseIsoDate(iso)` accepts `yyyy-mm-dd`, optional `THH:MM` (or space) for
  datetime-local, and bare `yyyy-mm` for month fields. Returns `{ y, m, d, time, hasDay }` or `null`
  for malformed or impossible dates (2025-02-30). A missing day defaults to 1 with `hasDay: false`.
- `DateFormatter.nativeDateValue(type, parsed)` returns the value string for a native input of type
  `date`, `datetime-local` (time defaults to `00:00`), `month` or `week` (ISO week), else `null`.
- `DateFormatter.formatFromHint(hint)` reads a format `{ order, sep, yearLen, pad, source }` from
  hint text: token patterns in several languages (`MM/DD/YYYY`, `jj/mm/aaaa`, `TT.MM.JJJJ`) or an
  example date. An example where neither of the first two fields exceeds 12 is ambiguous and yields
  `null`.
- `DateFormatter.detectDateFormat({ hints, currentValue, lang })` picks the format: an explicit pattern
  or example in the hints wins, then the shape of the field's current value (`source:
  'current-value'`), then the page language's conventional short date (`source: 'locale'`).
- `DateFormatter.formatDate(parsed, format)` renders a parsed date in a format.
- `DateFormatter.describeFormat(format)` returns the human pattern, e.g. `MM/DD/YYYY`.
- `DateFormatter.digitsOf(text)` keeps digits only. Masks re-punctuate freely, so what was typed is
  compared by digits.

## Locale table

US English, `fil` and `en-PH` are M/D/Y with `/`. `ja`, `zh`, `ko`, `sv`, `lt`, `hu`, `fr-CA`, `en-CA`
are Y-M-D. Most of central/northern/eastern Europe is D.M.Y. `nl` is D-M-Y. Everything else is D/M/Y.
