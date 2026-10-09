# ScheduledTaskForm

`core/llm-server/ui/js/tasks/ScheduledTaskForm.js`

The Scheduled Task setup form: schema, interval presets (5 minutes to 7
days, as the server allows) and the opening turn a submitted form becomes.

## Methods

- `SCHEMA`, `EVERY_OPTIONS`, `INITIAL` (`{ everyMinutes: '1440', runTest: true }`).
- `everyLabel(minutes)`: the preset label lowercased, else "every N minutes".
- `openingTurn(data)`: starts with "(Setup form submitted)", which the mode's
  system prompt keys on to create the task at once.
