# RecurrenceExpander

`extensions/personal-hub/calendar/ics/RecurrenceExpander.js`

Expands a VEVENT's RRULE into the occurrences inside a window: DAILY, WEEKLY,
MONTHLY and YEARLY with INTERVAL, COUNT, UNTIL, BYDAY (weekly lists; monthly
and yearly ordinals such as `2MO` and `-1FR`), BYMONTHDAY (negative allowed)
and BYMONTH. EXDATEs are removed after COUNT is applied, as the RFC says, and
RECURRENCE-ID overrides replace their occurrence.

## Methods (static)

- `expand(vevent, { from, to, maxOccurrences = 1000, overrides })` ->
  `[{ start, end, vevent }]` (ms), sorted, overlapping `[from, to)`. A
  non-recurring event yields one occurrence. `overrides` is a Map from the
  RECURRENCE-ID's ms value to the override VEVENT; an override that matches no
  generated occurrence (moved outside the rule) is still emitted.
- `durationMs(vevent, startMs)`: DTEND, then DURATION, then one day for an
  all-day event, else zero.
- `parseDuration('P1DT2H30M')`, `parseRule('FREQ=...')`.

## Why wall-clock generation

Candidates are generated as wall-clock dates in the event's zone and each one
is converted to UTC separately, so a weekly 09:00 Berlin meeting stays at 09:00
across the DST change (07:00Z in summer, 08:00Z in winter). Generation is
bounded by `MAX_PERIODS`, the window end, UNTIL, COUNT and `maxOccurrences`, so
an unbounded rule can never loop forever. WKST is ignored (weeks start Monday).
