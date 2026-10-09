# ScheduleControl

`core/shell/shellClassifier/rules/system/ScheduleControl.js`

[HostCapability](HostCapability.md) for scheduled jobs. Changes ask.

- `crontab`: `-r`, `-e`, `-` or a file (installs a whole table); `-l` lists.
- `schtasks`: anything but `/query`.
- `at` with a time spec (not `-l`).
- `Register|Unregister|Set|Disable|Enable|New|Start|Stop-ScheduledTask`.
