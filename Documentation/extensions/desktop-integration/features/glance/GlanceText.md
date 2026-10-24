# GlanceText

`extensions/desktop-integration/features/glance/GlanceText.js`

Pure text helpers for the [glance](index.md):

- `clock(date, '12h' | '24h')` -> `2:30pm` or `14:30`.
- `duration(minutes)` -> `12m`, `1h`, `1h 5m`.
- `dayWord(date, now)` -> `today`, `tomorrow` or a short weekday.
- `startOfDay(date)`, `oneLine(text)` (whitespace collapsed).
- `clip(text, max)`: cut with an ASCII `...`.
- `fit(segments, separator, max)`: joins `{ pre, title, post }` segments; past
  `max`, shortens the longest titles first (down to `MIN_TITLE`, 6), then clips
  the whole line.
