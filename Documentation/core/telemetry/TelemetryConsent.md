# TelemetryConsent

`core/telemetry/TelemetryConsent.js`

Decides whether the app may send its anonymous pulse check-in to lumabyte.com.

## Methods

- `new TelemetryConsent(db, { isDev })`; `db` is the settings database.
- `allowed` is `false` in developer mode or after the user opts out, otherwise `true`.
- `optOut` reads the saved choice (settings key `core.telemetry.optOut`, the
  same key legacy used, so existing choices carry over).
- `setOptOut(optOut)` saves the choice as a boolean and returns it.
- `status()` returns `{ allowed, optOut, developerMode }` for the Settings UI.
