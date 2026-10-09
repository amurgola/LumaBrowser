# TaskFields

`extensions/timed-tasks/TaskFields.js`

Maps the camelCase task fields to `timed_tasks` columns and owns the interval
rules.

## Methods (static)

- `clampInterval(value)`: at least 60000 ms; non-numeric or 0 -> 3600000.
- `nextRun(intervalMs, fromMs?)`: ISO time one interval (at least 1 s, default
  an hour) after `fromMs` or now.
- `forCreate(data)`: `{ name, request_prompt, response_prompt, repeat_interval,
  webhook_url, enabled }` with defaults; throws `Name and request prompt are required`.
- `forUpdate(updates)`: `{ column: value }` for every present field of `name,
  requestPrompt, responsePrompt, webhookUrl, repeatInterval, enabled`; throws
  `No fields to update`.
