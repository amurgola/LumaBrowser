# RunDuration

`extensions/timed-tasks/ui/RunDuration.js`

The short duration of a timed-task run.

## Methods

- `RunDuration.between(startIso, endIso)`: `850ms` under a second, `4.2s`
  under a minute, else `1.5m`; `''` when either end is missing.
