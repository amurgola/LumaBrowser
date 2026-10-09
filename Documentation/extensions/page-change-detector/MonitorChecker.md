# MonitorChecker

`extensions/page-change-detector/MonitorChecker.js`

Runs one check of a monitor. Never rejects.

## Methods

- `new MonitorChecker({ monitors, snapshots, tabs, extractor, webhook,
  notifier, broadcast, now? })`.
- `check(monitor)`: resolves `{ changed, diffSummary }`, plus `error` /
  `skipped` as below. Steps:
  1. A check already running for the monitor: `{ changed: false, skipped:
     true, error: 'Check already in progress' }`.
  2. Status `checking`, broadcast `check-started`.
  3. Tab: a no-refresh monitor uses an open tab (hidden ones too) and is
     skipped with `NO_OPEN_TAB` when none matches; otherwise a silent tab is
     found or opened and given up to 5 s to load.
  4. Text via the extractor; unreadable -> `UNREADABLE` error on the row.
  5. Snapshot: checksum vs the latest stored one, diff summary on change,
     history row (500-char preview), `recordRead` on the monitor.
  6. On change: change count + 1, one event `{ monitorId, monitorName, url,
     timestamp, checksum, prevChecksum, diffSummary, textPreview (2000 chars),
     textLength, changeCount }` to subscribers (errors swallowed), a desktop
     notification when enabled, and the webhook when set. A webhook failure
     sets `last_status 'error'`, `last_error 'Webhook failed: ...'` and the
     outcome's `error`.
  7. Any throw: `last_status 'error'` with the message.
  8. Always: status `idle`, broadcast `check-finished`.
- `onChange(callback)`: returns the unsubscribe function (a no-op for a
  non-function).
- `reset()`: forgets in-flight checks (deactivate).
