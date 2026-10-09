# TelemetrySwitch

`ui/shell/settings/general/TelemetrySwitch.js`

The Privacy check-in switch over `core.telemetry` (on = allowed, so it saves the inverse opt-out); a development build locks it off.

## Methods

- `install()`, `load()`, `apply(status)`.

## Globals

Reads `window.electronAPI.getTelemetryStatus`, `setTelemetryOptOut`.
