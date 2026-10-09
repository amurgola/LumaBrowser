# TelemetryIpcHandlers

`core/telemetry/TelemetryIpcHandlers.js`

IPC controller for the Settings telemetry switch. Routes only; the logic is in
[TelemetryConsent](TelemetryConsent.md).

## Methods

- `new TelemetryIpcHandlers(consent, onChange)`; `onChange(consent)` runs after
  every opt-out change so the host can start or stop the pulse at once.
- `register()` handles:
  - `core.telemetry.getStatus` -> `consent.status()`
  - `core.telemetry.setOptOut(optOut)` -> `{ success: true, status }`
