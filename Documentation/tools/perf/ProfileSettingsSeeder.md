# ProfileSettingsSeeder

`tools/perf/ProfileSettingsSeeder.js`

Seeds a profiling run's `settings.db` through [SettingsDatabase](../../core/database/SettingsDatabase.md) before
the app starts: `core.setupComplete` (false when `LUMA_PERF_FIRST_RUN=1`), `core.app.autoCheckUpdates` false,
`core.adblocker.enabled` (false when `LUMA_PERF_NO_ADBLOCK=1`).

## Methods

- `ProfileSettingsSeeder.seed(dataDir, env)` writes and returns the values; `values(env)` computes them.
