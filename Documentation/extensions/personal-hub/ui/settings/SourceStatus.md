# SourceStatus

`extensions/personal-hub/ui/settings/SourceStatus.js`

The status wording of a Hub source row (a calendar feed or a task tracker),
shared by the calendar and task sections so both rows read the same.

## Methods (static)

- `dotClass(source)`: `''` (never synced), `ok`, or `bad` (last status
  `error`) for the `luma-dot`.
- `text(source)`: `Paused`, `Not synced yet, every 15 minutes`,
  `Synced 5 min ago, every 15 minutes`, or `Failed 2 h ago: <error>`.
  Uses [IntervalPicker.format](../../../ui-kit/ui/IntervalPicker.md) and
  [TimeText](../../../ui-kit/ui/TimeText.md).
