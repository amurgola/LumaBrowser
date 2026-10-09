# ActivityLogSettings

`core/activity-log/ActivityLogSettings.js`

The activity log's persisted settings under settings key `core.activityLog`:
`{ enabled, enabledCallers, retentionDays, retentionMaxRows }`.

## Methods

- `new ActivityLogSettings(settingsDb)` loads and merges over `DEFAULTS`
  (`enabled: false`, `enabledCallers: {}`, `retentionDays: 7`, `retentionMaxRows: 10000`).
  A non-object `enabledCallers` loads as `{}`.
- `snapshot()` deep copy of the current settings.
- `apply(patch)` validates, persists and returns a snapshot. `enabled` must be a
  boolean; retention values must be finite and are clamped to >= 0;
  `enabledCallers` merges; `replaceEnabledCallers` replaces (and wins if both are sent).
- `isCallerEnabled(caller)` false when the master switch is off, else false only
  for a caller explicitly set to `false`.
- `callerOverrides()` the `enabledCallers` map.
- `pruneLimits()` `{ maxAgeMs, maxRows }` for the store; a limit of 0 becomes null (unlimited).
- `ActivityLogSettings.KEY`, `ActivityLogSettings.DEFAULTS`.
