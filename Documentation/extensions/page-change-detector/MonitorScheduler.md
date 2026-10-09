# MonitorScheduler

`extensions/page-change-detector/MonitorScheduler.js`

One timer per enabled monitor.

## Methods

- `new MonitorScheduler({ checker, monitors, broadcast, random? })`.
- `MonitorScheduler.nextDelayMs(monitor, random?)`: the interval (default 5
  min, at least 1 s) moved by up to +/- `interval_jitter_percent` (0..100),
  never below 1 s.
- `start(monitor)`: replaces any timer; a disabled monitor is only stopped.
  Records `next_run` (no broadcast on the first arm).
- `stop(monitorId)`, `stopAll()`, `isScheduled(monitorId)`.

Each tick runs `checker.check(monitor)` and, unless the monitor was stopped
meanwhile, re-arms with a fresh jitter roll, records `next_run` and broadcasts
`scheduled`.

## Why

Jitter is re-rolled every cycle so monitors with the same interval drift apart
instead of hitting a site in lockstep.
