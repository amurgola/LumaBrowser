# TimedTaskScheduler

`extensions/timed-tasks/TimedTaskScheduler.js`

The single master tick of Timed Tasks.

## Methods

- `new TimedTaskScheduler({ repository, runner, now? })`.
- `start()`: ticks every `TICK_MS` (30 s) on an unref'd interval; `stop()`.
- `tick()`: drops itself while a previous tick is still running. Runs, one at
  a time, every enabled task that is not running and whose `next_run` is due.
  An enabled task with no `next_run` (older rows) is armed one interval out
  instead. A throwing run is logged and the rest still run.

## Why

There are no per-task timers: `next_run` is persisted, so schedules survive
sleep and restarts, and a missed window runs once instead of being back-filled.
