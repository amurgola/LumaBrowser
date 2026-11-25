# AndroidIpcHandlers

`extensions/android/AndroidIpcHandlers.js`

Controller for the settings tab's calls.

## Methods

- `AndroidIpcHandlers.register(ipc, { devices, tabs, settings })`: `overview` (the device overview plus the settings), `saveSettings`, `start`, `stop`, `create`, `open`. Each answers `{ success, data }` or `{ success: false, error }`.
