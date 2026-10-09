# TelemetryPanel

`core/shell/ui/settings/TelemetryPanel.js` (ES module)

Settings > About > Privacy: the build status, the anonymous lumabyte.com check-in state, and Re-run first-run setup.

## Methods

- `new TelemetryPanel(container, hooks)`, `load()`: `core.telemetry.getStatus`
  (`{ allowed, optOut, developerMode }`).
- `TelemetryPanel.checkInText(status)`: On, "Off (development build)", "Off
  (your choice)" or Off.
- Re-run hides Settings, then `hooks.rerunSetupWizard()`.

## Globals

Reads `window.ipcBridge.invoke`.
