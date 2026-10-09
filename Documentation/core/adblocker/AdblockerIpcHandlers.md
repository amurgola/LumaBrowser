# AdblockerIpcHandlers

`core/adblocker/AdblockerIpcHandlers.js`

IPC controller for the ad blocker toggle in Settings. Routes to
[AdblockerService](AdblockerService.md).

## Methods

- `new AdblockerIpcHandlers(adblockerService)`.
- `register()` registers:
  - `core.adblocker.getEnabled` -> `adblockerService.isEnabled()`, replied **raw** as a boolean
  - `core.adblocker.setEnabled(enabled)` -> `await adblockerService.setEnabled(enabled)`, replies
    `{ success: true, enabled: isEnabled() }`, or `{ success: false, error }` (enveloped)
- `AdblockerIpcHandlers.CHANNELS` the channel names.

## Why getEnabled is raw

The renderer does `checkbox.checked = await invoke('core.adblocker.getEnabled')`.
An envelope is an object and therefore always truthy, so the toggle would read
"on" whatever the real setting.
