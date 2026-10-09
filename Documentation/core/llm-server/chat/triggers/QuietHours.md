# QuietHours

`core/llm-server/chat/triggers/QuietHours.js`

Quiet hours for triggers: a daily local-time window during which real events are
deferred or skipped.

## Methods

- `QuietHours.normalize(config)` accepts `{ start: 'HH:MM', end: 'HH:MM',
  days?: [0..6], mode?: 'defer' | 'skip' }` or a `"HH:MM-HH:MM"` string (also
  "to" or an en dash between the times). Returns `{ start, end, mode, days? }`
  with zero-padded times and `mode` defaulting to `defer`, or `null` when unusable
  or empty (bad times, start equal to end). `days` is deduplicated, sorted and
  dropped when empty or all seven.
- `QuietHours.check(config, now = new Date())` returns `{ quiet: true, resumesAt }`
  (the Date the window ends) or `{ quiet: false, resumesAt: null }`.
- `QuietHours.MAX_DEFERRED` (50) is how many events the runner holds per trigger.

## Why

`defer` holds events and releases them in order when the window ends; `skip` logs
and drops them. Tests and manual runs ignore quiet hours (the runner's choice).

Overnight windows (22:00 to 07:00) are fine. `days` uses JS `getDay` (0 is
Sunday) and, for an overnight window, the day is judged by when the window
started, so a "weeknights" window still covers Saturday 03:00 after a Friday
22:00 start.
