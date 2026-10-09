# TaskInterval

`core/llm-server/chat/scheduled-task/TaskInterval.js`

Scheduled-task intervals as the setup model sees them.

## Methods

- `TaskInterval.MIN_EVERY_MINUTES` (5) and `MAX_EVERY_MINUTES` (10080, 7 days),
  from `ScheduledTaskStore.MIN_INTERVAL_MS` / `MAX_INTERVAL_MS`.
- `TaskInterval.describe(ms)`: `every day`, `every 3 days`, `every hour`,
  `every 2 hours` or `every 45 minutes`.
- `TaskInterval.toMinutes(ms)`: rounded minutes.
- `TaskInterval.fromMinutes(everyMinutes, fallbackMinutes)`: milliseconds;
  non-numeric or zero input uses the fallback. The store clamps the range.
